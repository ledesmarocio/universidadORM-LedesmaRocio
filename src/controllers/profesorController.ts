import { Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';
import { Profesor } from '../models/ProfesorModel';
import { AppDataSource } from '../db/conexion';
import { Curso } from '../models/CursoModel';

var profesores: Profesor[];

export const validar = () => [
    check('dni')
        .notEmpty().withMessage('El DNI es obligatorio')
        .isLength({ min: 7 }).withMessage('El DNI debe tener al menos 7 caracteres')
        .isNumeric().withMessage('El dni del profesor debe ser un número'),
    check('nombre').notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 3 }).withMessage('El Nombre debe tener al menos 3 caracteres')
        .matches(/^[a-zA-Z\s]+$/).withMessage('El nombre del curso solo puede contener letras'),
    check('apellido').notEmpty().withMessage('El apellido es obligatorio')
    .matches(/^[a-zA-Z\s]+$/).withMessage('El apellido del profesor solo puede contener letras')
        .isLength({ min: 3 }).withMessage('El Apellido debe tener al menos 3 caracteres'),
    check('email').isEmail().withMessage('Debe proporcionar un email válido')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
    check('profesion').notEmpty().withMessage('Debe tener una profesión asignada')
    .matches(/^[a-zA-Z\s]+$/).withMessage('La profesión solo puede contener letras'),
    check('telefono')
        .notEmpty()
        .isLength({ min: 10 })
        .withMessage('Debe insertar un número de teléfono')
        .isNumeric().withMessage('El telefono del profesor debe ser un número'),

    (req: Request, res: Response, next: NextFunction) => {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return res.render('crearProfesores', {
                pagina: 'Crear Profesores',
                errores: errores.array()
            });
        }
        next();
    }
];

export const consultarTodos = async (req: Request, res: Response) => {
    try {
        const profesorRepository = AppDataSource.getRepository(Profesor);
        const profesores = await profesorRepository.find();
        res.render('listarProfesores', {
            pagina: 'Lista de Profesores',
            profesores
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

export const listaProfesores = async (req: Request, res: Response): Promise<Profesor[]> => {
    try {
        const profesorRepository = AppDataSource.getRepository(Profesor);
        const profesores = await profesorRepository.find();
        return profesores; // Siempre devolverá un array, aunque esté vacío
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
            throw err; // Lanzar el error de nuevo si es necesario manejarlo más arriba
        }
        throw new Error('Error desconocido'); // Para cualquier otro tipo de error
    }
};




export const consultarUno = async (req: Request, res: Response): Promise<Profesor | null> => {
    const { id } = req.params;
    const idNumber = Number(id);
    if (isNaN(idNumber)) {
        throw new Error('ID inválido, debe ser un número');
    }
    try {
        const profesorRepository = AppDataSource.getRepository(Profesor);
        const profesor = await profesorRepository.findOne({ where: { id: idNumber } });

        if (profesor) {

            return profesor;
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

export const listarProfesores = async (req: Request, res: Response): Promise<Profesor[] | null | undefined> => {
    try {
        const profesorRepository = AppDataSource.getRepository(Profesor);
        const profesores = await profesorRepository.find();
        return profesores ? profesores : null;
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.render('No se ha encontrado el profesor');
        }
    }
};
export const insertar = async (req: Request, res: Response): Promise<void> => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.render('cargaProfesores', {
            pagina: 'Crear Profesores',
            errores: errores.array()
        });
    }
    const { dni, nombre, apellido, email, profesion, telefono } = req.body;

    try {
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            const profesorRepository = transactionalEntityManager.getRepository(Profesor);
            const existeProfesor = await profesorRepository.findOne({
                where: [
                    { dni },
                    { email }
                ]
            });

            if (existeProfesor) {
                throw new Error('El profesor ya existe.');
            }
            const nuevoProfesor = profesorRepository.create({ dni, nombre, apellido, email, profesion, telefono });
            await profesorRepository.save(nuevoProfesor);
        });
        const profesores = await AppDataSource.getRepository(Profesor).find();
        res.render('listarProfesores', {
            pagina: 'Lista de Profesores',
            profesores
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};
export const modificar = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { dni, nombre, apellido, email, profesion, telefono } = req.body;
    try {
        const profesorRepository = AppDataSource.getRepository(Profesor);
        const profesor = await profesorRepository.findOne({ where: { id: parseInt(id) } });

        if (!profesor) {
            return res.status(404).send('profesor no encontrado');
        }
        profesorRepository.merge(profesor, { dni, nombre, apellido, email, profesion, telefono });
        await profesorRepository.save(profesor);
        return res.redirect('/profesores/listarProfesores');
    } catch (error) {
        console.error('Error al modificar el profesor:', error);
        return res.status(500).send('Error del servidor acaaaaaaaaaaa');
    }
};

export const eliminar = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        //console.log(`ID recibido para eliminar: ${id}`); 
        await AppDataSource.transaction(async transactionalEntityManager => {
            const cursoRepository = transactionalEntityManager.getRepository(Curso); //conectar con tabla curso
            const profesorRepository = transactionalEntityManager.getRepository(Profesor);

            const cursosRelacionados = await cursoRepository.count({ where: { profesor: { id: Number(id) } } });
            if (cursosRelacionados > 0) {
                throw new Error('Profesor dictando materias, no se puede eliminar');
            }
            const deleteResult = await profesorRepository.delete(id);

            if (deleteResult.affected === 1) {
                return res.json({ mensaje: 'Profesor eliminado' });
            } else {
                throw new Error('Profesor no encontrado');
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
