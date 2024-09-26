import { Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';
import { Curso } from '../models/CursoModel';
import { AppDataSource } from '../db/conexion';
import { Profesor } from '../models/ProfesorModel';
import { CursoEstudiante } from '../models/CursoEstudianteModel';


var cursos: Curso[];

export const validar = () => [
    check('descripcion')
        .notEmpty().withMessage('Debe aplicar una descripción del curso')
        .matches(/^[a-zA-Z\s]+$/).withMessage('El nombre del curso solo puede contener letras'),
    check('profesor_id').notEmpty().withMessage('Debe indicar el profesor que dicta este curso ')
    .isNumeric().withMessage('El ID del profesor debe ser un número'),
    check('nombre').notEmpty().withMessage('Debe aplicar el nombre del curso')
    .matches(/^[a-zA-Z\s]+$/).withMessage('El nombre del curso solo puede contener letras'),
    async (req: Request, res: Response, next: NextFunction) => {
        const errores = validationResult(req);
        const profesorRepository = AppDataSource.getRepository(Profesor);
            const profesores = await profesorRepository.find();
        if (!errores.isEmpty()) {
            return res.render('crearCursos', {
                pagina: 'Crear Curso',
                errores: errores.array(),
                profesores:profesores
            });
        }
        next();
    }
];

export const consultarTodos = async (req: Request, res: Response): Promise<void> => {
    try {
        const cursoRepository = AppDataSource.getRepository(Curso);
        const profesorRepository = AppDataSource.getRepository(Profesor);
        const profesores= await profesorRepository.find()
        const cursos = await cursoRepository.find({
            relations: ['profesor'] // Cargar la relación con profesor
        });

        res.render('listarCursos', {
            pagina: 'Lista de Cursos',
            cursos,
            profesores
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};


export const consultarUno = async (req: Request, res: Response): Promise<Curso | null> => {
    const { id } = req.params;
    const idNumber = Number(id);
    if (isNaN(idNumber)) {
        throw new Error('ID inválido, debe ser un número');
    }
    try {
        const cursoRepository = AppDataSource.getRepository(Curso);
        const curso = await cursoRepository.findOne({ where: { id: idNumber }, relations: ["profesor"] });

        if (curso) {
            return curso;
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
};

export const listarCursos = async (req: Request, res: Response): Promise<Curso[] | null | undefined> => {
    try {
        const cursoRepository = AppDataSource.getRepository(Curso);
        const cursos = await cursoRepository.find();
        return cursos ? cursos : null;
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.render('No se ha encontrado el curso');
        }
    }
};
export const insertar = async (req: Request, res: Response): Promise<void> => {
    const errores = validationResult(req);
    const profesorRepository= AppDataSource.getRepository(Profesor);
    const profesores= await profesorRepository.find();
    if (!errores.isEmpty()) {
        return res.render('cargaCursos', {
            pagina: 'Crear Curso',
            profesores,
            errores: errores.array()
        });
    }
    const { descripcion, profesor_id, nombre } = req.body;
   
    try {
       
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            const cursoRepository = transactionalEntityManager.getRepository(Curso);
            const profesorRepository = transactionalEntityManager.getRepository(Profesor);
           
            const existeProfesor= await profesorRepository.findOne({where: {id: Number(profesor_id)}});
            console.log('Profesor encontrado', existeProfesor);

            if(!existeProfesor){
                throw new Error ('El profesor no existe')
            }
            const existeCurso= await cursoRepository.findOne({
                where:[
                    {nombre},
                    {descripcion}
                ]
            });

            if(existeCurso){
                throw new Error('El curso ya existe')
            }
       
            const nuevoCurso=cursoRepository.create({nombre, descripcion, profesor:existeProfesor})
            console.log('Nuevo curso a insertar: ', nuevoCurso);
            await cursoRepository.save(nuevoCurso);

            

            res.redirect('/cursos/listarCursos');

            

          
        }
        );

    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

export const modificar = async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNumero = parseInt(id);
    const { descripcion, profesor_id, nombre } = req.body;
    try {
        await AppDataSource.transaction(async (transactionEntityManager) => {
            const profesorRepository = transactionEntityManager.getRepository(Profesor);
            const cursoRepository = transactionEntityManager.getRepository(Curso);

            const existeProfesor = await profesorRepository.findOne({
                where: [
                    { id: profesor_id }
                ]

            });

            if (!existeProfesor) {
                return res.status(404).send("El profesor no existe");
            }

            const existeCurso = await cursoRepository.findOne({
                where: [
                    { id: idNumero }
                ]
            });

            if (!existeCurso) {
                return res.status(404).send("El curso no existe");
            }
            cursoRepository.merge(existeCurso,{descripcion, profesor: existeProfesor,nombre});
            await cursoRepository.save(existeCurso);
            return res.redirect('/cursos/listarCursos');
        });
        
    } catch (error) {
        console.error('Error al modificar el curso:', error);
        return res.status(500).send('Error del servidor');
    }
};

export const eliminar = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        //console.log(`ID recibido para eliminar: ${id}`); 
        await AppDataSource.transaction(async transactionalEntityManager => {
            const cursosEstudiantesRepository = transactionalEntityManager.getRepository(CursoEstudiante);
            const cursoRepository = transactionalEntityManager.getRepository(Curso);

            const cursosRelacionados = await cursosEstudiantesRepository.count({ where: { curso: { id: Number(id) } } });
            if (cursosRelacionados > 0) {
                throw new Error('Hay estudiantes inscriptos a este curso. No se puede eliminar');
            }
            const deleteResult = await cursoRepository.delete(id);

            if (deleteResult.affected === 1) {
                return res.json({ mensaje: 'Curso eliminado' });
            } else {
                throw new Error('Curso no encontrado');
            }
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(400).json({ mensaje: err.message });
        } else {
            res.status(400).json({ mensaje: 'Error' });
        }
    }
};
