"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminar = exports.modificarNota = exports.inscribir = exports.consultarUnaInscripcion = exports.consultarTodos = exports.validar = void 0;
const express_validator_1 = require("express-validator");
const EstudianteModel_1 = require("../models/EstudianteModel");
const conexion_1 = require("../db/conexion");
const CursoEstudianteModel_1 = require("../models/CursoEstudianteModel");
const CursoModel_1 = require("../models/CursoModel");
var inscripciones;
const validar = () => [
    (0, express_validator_1.check)('curso_id')
        .notEmpty().withMessage('Debe elegir el curso'),
    (0, express_validator_1.check)('estudiante_id').notEmpty().withMessage('Debe ingresar el estudiante'),
    (0, express_validator_1.check)('nota').isFloat({ min: 1.0, max: 10.0 }).withMessage('El número debe ser un decimal entre 1.0 y 10.0.').isNumeric().withMessage('La nota debe ser un número'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const errores = (0, express_validator_1.validationResult)(req);
        const estudianteRepository = conexion_1.AppDataSource.getRepository(EstudianteModel_1.Estudiante);
        const estudiantes = yield estudianteRepository.find();
        const cursoRepository = conexion_1.AppDataSource.getRepository(CursoModel_1.Curso);
        const cursos = yield cursoRepository.find();
        if (!errores.isEmpty()) {
            return res.render('crearInscripciones', {
                pagina: 'Crear Inscripción',
                errores: errores.array(),
                estudiantes: estudiantes,
                cursos: cursos
            });
        }
        next();
    })
];
exports.validar = validar;
const consultarTodos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cursoEstudianteRepository = conexion_1.AppDataSource.getRepository(CursoEstudianteModel_1.CursoEstudiante);
        const cursoRepository = conexion_1.AppDataSource.getRepository(CursoModel_1.Curso);
        const estudianteRepository = conexion_1.AppDataSource.getRepository(EstudianteModel_1.Estudiante);
        inscripciones = yield cursoEstudianteRepository.find({
            relations: ['estudiante', 'curso'],
        });
        const cursos = yield cursoRepository.find();
        const estudiantes = yield estudianteRepository.find();
        res.render('listarInscripciones', {
            pagina: 'Lista de Inscripciones',
            inscripciones,
            cursos,
            estudiantes
        });
        // res.status(200).json(inscripciones);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
});
exports.consultarTodos = consultarTodos;
const consultarUnaInscripcion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { curso_id, estudiante_id } = req.params;
    try {
        const cursoEstudianteRepository = conexion_1.AppDataSource.getRepository(CursoEstudianteModel_1.CursoEstudiante);
        const inscripcion = yield cursoEstudianteRepository.findOne({
            where: {
                curso_id: parseInt(curso_id),
                estudiante_id: parseInt(estudiante_id)
            }
        });
        if (!inscripcion) {
            res.status(404).send('No se encontró la inscripción para el estudiante en el curso especificado.');
            return null;
        }
        return inscripcion;
    }
    catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        else {
            throw new Error('Error desconocido');
        }
    }
});
exports.consultarUnaInscripcion = consultarUnaInscripcion;
const inscribir = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { curso_id, estudiante_id, nota } = req.body;
    // Convertir IDs a enteros
    const cursoId = parseInt(curso_id);
    const estudianteId = parseInt(estudiante_id);
    // Verificar que los IDs sean números válidos
    if (isNaN(cursoId) || isNaN(estudianteId)) {
        throw new Error('ID del curso o estudiante no es válido.');
    }
    try {
        yield conexion_1.AppDataSource.transaction((transactionalEntityManager) => __awaiter(void 0, void 0, void 0, function* () {
            const estudianteRepository = transactionalEntityManager.getRepository(EstudianteModel_1.Estudiante);
            const cursoRepository = transactionalEntityManager.getRepository(CursoModel_1.Curso);
            const cursoEstudianteRepository = transactionalEntityManager.getRepository(CursoEstudianteModel_1.CursoEstudiante);
            // Verificar si el estudiante existe
            const existeEstudiante = yield estudianteRepository.findOne({ where: { id: estudianteId } });
            if (!existeEstudiante) {
                throw new Error('El estudiante no existe.');
            }
            // Verificar si el curso existe
            const existeCurso = yield cursoRepository.findOne({ where: { id: cursoId } });
            if (!existeCurso) {
                throw new Error('El curso no existe.');
            }
            // Verificar si ya existe la inscripción
            const existeInscripcion = yield cursoEstudianteRepository.findOne({
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
            yield cursoEstudianteRepository.save(nuevaInscripcion);
        }));
        // Renderizar la vista después de inscribir
        const inscripciones = yield conexion_1.AppDataSource.getRepository(CursoEstudianteModel_1.CursoEstudiante).find({ relations: ['curso', 'estudiante'] });
        const cursos = yield conexion_1.AppDataSource.getRepository(CursoModel_1.Curso).find();
        const estudiantes = yield conexion_1.AppDataSource.getRepository(EstudianteModel_1.Estudiante).find();
        res.render('listarInscripciones', {
            pagina: 'Lista de inscripciones',
            inscripciones,
            cursos,
            estudiantes
        });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
});
exports.inscribir = inscribir;
const modificarNota = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { curso_id, estudiante_id } = req.params;
    const { nota } = req.body;
    try {
        const cursoEstudianteRepository = conexion_1.AppDataSource.getRepository(CursoEstudianteModel_1.CursoEstudiante);
        // Buscar la inscripción por curso_id y estudiante_id
        const inscripcion = yield cursoEstudianteRepository.findOneBy({
            curso_id: parseInt(curso_id),
            estudiante_id: parseInt(estudiante_id)
        });
        if (!inscripcion) {
            return res.status(404).send('Inscripción no encontrada');
        }
        console.log('Inscripción antes de la actualización:', inscripcion);
        console.log('Nota a actualizar:', nota);
        // Actualizar la nota de la inscripción
        cursoEstudianteRepository.merge(inscripcion, req.body);
        yield cursoEstudianteRepository.save(inscripcion);
        // Verificar si la actualización se realizó correctamente
        const updatedInscripcion = yield cursoEstudianteRepository.findOne({
            where: {
                curso_id: parseInt(curso_id),
                estudiante_id: parseInt(estudiante_id)
            }
        });
        console.log('Inscripción después de guardar:', updatedInscripcion);
        // Redirigir después de la actualización
        return res.redirect('/inscripciones/listarInscripciones');
    }
    catch (error) {
        console.error('Error al modificar la nota:', error);
        return res.status(500).send('Error del servidor');
    }
});
exports.modificarNota = modificarNota;
const eliminar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { curso_id, estudiante_id } = req.params;
    try {
        yield conexion_1.AppDataSource.transaction((transactionalEntityManager) => __awaiter(void 0, void 0, void 0, function* () {
            const cursosEstudiantesRepository = transactionalEntityManager.getRepository(CursoEstudianteModel_1.CursoEstudiante);
            const inscripcion = yield cursosEstudiantesRepository.findOne({
                where: {
                    curso_id: parseInt(curso_id),
                    estudiante_id: parseInt(estudiante_id)
                }
            });
            if (!inscripcion) {
                throw new Error('No existe una inscripción para este estudiante en el curso especificado.');
            }
            yield cursosEstudiantesRepository.remove(inscripcion);
            res.status(200).json({ mensaje: 'Inscripción eliminada exitosamente.' });
        }));
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ mensaje: err.message });
        }
        else {
            res.status(400).json({ mensaje: 'Error en la eliminación de la inscripción.' });
        }
    }
});
exports.eliminar = eliminar;
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
