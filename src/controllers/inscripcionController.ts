import { Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';
import { Estudiante } from '../models/EstudianteModel';
import { AppDataSource } from '../db/conexion';
import { CursoEstudiante } from '../models/CursoEstudianteModel';
import { Curso } from '../models/CursoModel';

var inscripciones: CursoEstudiante[];

export const validar = () => [
    check('curso_id')
        .notEmpty().withMessage('Debe elegir el curso'),
    check('estudiante_id').notEmpty().withMessage('Debe ingresar el estudiante'),
    check('nota').isFloat({ min: 1.0, max: 10.0 }).withMessage('El número debe ser un decimal entre 1.0 y 10.0.'),
    async (req: Request, res: Response, next: NextFunction) => {
        const errores = validationResult(req);
        const estudianteRepository = AppDataSource.getRepository(Estudiante);
        const estudiantes = await estudianteRepository.find();
        const cursoRepository = AppDataSource.getRepository(Curso);
        const cursos = await cursoRepository.find();
        if (!errores.isEmpty()) {
            return res.render('crearInscripciones', {
                pagina: 'Crear Inscripción',
                errores: errores.array(),
                estudiantes: estudiantes,
                cursos: cursos
            });
        }
        next();
    }
];

export const consultarTodos = async (req: Request, res: Response) => {
    try {
        const cursoEstudianteRepository = AppDataSource.getRepository(CursoEstudiante);
        const cursoRepository = AppDataSource.getRepository(Curso);
        const estudianteRepository = AppDataSource.getRepository(Estudiante);
        inscripciones = await cursoEstudianteRepository.find({
            relations: ['estudiante', 'curso'],
        });
        const cursos = await cursoRepository.find();
        const estudiantes = await estudianteRepository.find();

        res.render('listarInscripciones', {
            pagina: 'Lista de Inscripciones',
            inscripciones,
            cursos,
            estudiantes

        });

        // res.status(200).json(inscripciones);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};
export const consultarUnaInscripcion = async (req: Request, res: Response): Promise<CursoEstudiante | null> => {
    const { curso_id, estudiante_id } = req.params;
    try {
        const cursoEstudianteRepository = AppDataSource.getRepository(CursoEstudiante);
        const inscripcion = await cursoEstudianteRepository.findOne({
            where: {
                curso_id: parseInt(curso_id),
                estudiante_id: parseInt(estudiante_id)
            }
        })
        if (!inscripcion) {
            res.status(404).send('No se encontró la inscripción para el estudiante en el curso especificado.');
            return null;
        }

        return inscripcion;

    } catch (err: unknown) {
        if (err instanceof Error) {
            throw err;
        } else {
            throw new Error('Error desconocido');
        }
    }
};



export const inscribir = async (req: Request, res: Response): Promise<void> => {
    const { curso_id, estudiante_id, nota } = req.body;

    // Convertir IDs a enteros
    const cursoId = parseInt(curso_id);
    const estudianteId = parseInt(estudiante_id);

    // Verificar que los IDs sean números válidos
    if (isNaN(cursoId) || isNaN(estudianteId)) {
        throw new Error('ID del curso o estudiante no es válido.');
    }

    try {
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            const estudianteRepository = transactionalEntityManager.getRepository(Estudiante);
            const cursoRepository = transactionalEntityManager.getRepository(Curso);
            const cursoEstudianteRepository = transactionalEntityManager.getRepository(CursoEstudiante);

            // Verificar si el estudiante existe
            const existeEstudiante = await estudianteRepository.findOne({ where: { id: estudianteId } });
            if (!existeEstudiante) {
                throw new Error('El estudiante no existe.');
            }

            // Verificar si el curso existe
            const existeCurso = await cursoRepository.findOne({ where: { id: cursoId } });
            if (!existeCurso) {
                throw new Error('El curso no existe.');
            }

            // Verificar si ya existe la inscripción
            const existeInscripcion = await cursoEstudianteRepository.findOne({
                where: { curso: { id: cursoId }, estudiante: { id: estudianteId } }
            });
            if (existeInscripcion) {
                throw new Error('El estudiante ya está inscrito en este curso.');
            }

            // Crear nueva inscripción
            const nuevaInscripcion = cursoEstudianteRepository.create({
                curso: { id: cursoId },
                estudiante: { id: estudianteId },
                nota
            });

            // Guardar la inscripción
            await cursoEstudianteRepository.save(nuevaInscripcion);
        });

        // Renderizar la vista después de inscribir
        const inscripciones = await AppDataSource.getRepository(CursoEstudiante).find( {relations: ['curso', 'estudiante']});
        const cursos = await AppDataSource.getRepository(Curso).find();
        const estudiantes = await AppDataSource.getRepository(Estudiante).find();
        res.render('listarInscripciones', {
            pagina: 'Lista de inscripciones',
            inscripciones,
            cursos,
            estudiantes
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};
export const modificarNota = async (req: Request, res: Response) => {
    const { curso_id, estudiante_id } = req.params;
    const { nota } = req.body;

    try {
        const cursoEstudianteRepository = AppDataSource.getRepository(CursoEstudiante);

        // Buscar la inscripción por curso_id y estudiante_id
        const inscripcion = await cursoEstudianteRepository.findOneBy({
            curso_id: parseInt(curso_id),
            estudiante_id: parseInt(estudiante_id)
        });

        if (!inscripcion) {
            return res.status(404).send('Inscripción no encontrada');
        }
       
        // Actualizar la nota de la inscripción
        cursoEstudianteRepository.merge(inscripcion, req.body);
        await cursoEstudianteRepository.save(inscripcion);
        // Verificar si la actualización se realizó correctamente
        const updatedInscripcion = await cursoEstudianteRepository.findOne({
            where: {
                curso_id: parseInt(curso_id),
                estudiante_id: parseInt(estudiante_id)
            }
        });
        console.log('Inscripción después de guardar:', updatedInscripcion);
        // Redirigir después de la actualización
        return res.redirect('/inscripciones/listarInscripciones');
    } catch (error) {
        console.error('Error al modificar la nota:', error);
        return res.status(500).send('Error del servidor');
    }
};


export const eliminar = async (req: Request, res: Response): Promise<void> => {
    const { curso_id, estudiante_id } = req.params;
    try {
        await AppDataSource.transaction(async transactionalEntityManager => {
            const cursosEstudiantesRepository = transactionalEntityManager.getRepository(CursoEstudiante);

            const inscripcion = await cursosEstudiantesRepository.findOne({
                where: {
                    curso_id: parseInt(curso_id),
                    estudiante_id: parseInt(estudiante_id)
                }
            });

            if (!inscripcion) {
                throw new Error('No existe una inscripción para este estudiante en el curso especificado.');
            }

            await cursosEstudiantesRepository.remove(inscripcion);
            res.status(200).json({ mensaje: 'Inscripción eliminada exitosamente.' });
            
            
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(400).json({ mensaje: err.message });
        } else {
            res.status(400).json({ mensaje: 'Error en la eliminación de la inscripción.' });
        }
    }
};



/*export const consultarxAlumno = async (req: Request, res: Response): Promise<CursoEstudiante | null> => {
    const { id } = req.params;
    const idNumber = Number(id);
    if (isNaN(idNumber)) {
        throw new Error('ID inválido, debe ser un número');
    }
    try {
        const estudianteRepository = AppDataSource.getRepository(Estudiante);
        const cursoEstudianteRepository = AppDataSource.getRepository(CursoEstudiante);
        const cursoRepository = AppDataSource.getRepository(Curso);
        const estudiante = await estudianteRepository.findOne({ where: { id: idNumber } });

        if (estudiante) {
            return estudiante;
        } else {

            return null;
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            throw err;
        } else {
            throw new Error('Error desconocido');
        }
    }
};*/
