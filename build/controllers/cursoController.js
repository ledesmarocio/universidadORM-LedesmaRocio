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
exports.eliminar = exports.modificar = exports.insertar = exports.listarCursos = exports.consultarUno = exports.consultarTodos = exports.validar = void 0;
const express_validator_1 = require("express-validator");
const CursoModel_1 = require("../models/CursoModel");
const conexion_1 = require("../db/conexion");
const ProfesorModel_1 = require("../models/ProfesorModel");
const CursoEstudianteModel_1 = require("../models/CursoEstudianteModel");
var cursos;
const validar = () => [
    (0, express_validator_1.check)('descripcion')
        .notEmpty().withMessage('Debe aplicar una descripción del curso')
        .matches(/^[a-zA-Z\s]+$/).withMessage('El nombre del curso solo puede contener letras'),
    (0, express_validator_1.check)('profesor_id').notEmpty().withMessage('Debe indicar el profesor que dicta este curso ')
        .isNumeric().withMessage('El ID del profesor debe ser un número'),
    (0, express_validator_1.check)('nombre').notEmpty().withMessage('Debe aplicar el nombre del curso')
        .matches(/^[a-zA-Z\s]+$/).withMessage('El nombre del curso solo puede contener letras'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const errores = (0, express_validator_1.validationResult)(req);
        const profesorRepository = conexion_1.AppDataSource.getRepository(ProfesorModel_1.Profesor);
        const profesores = yield profesorRepository.find();
        if (!errores.isEmpty()) {
            return res.render('crearCursos', {
                pagina: 'Crear Curso',
                errores: errores.array(),
                profesores: profesores
            });
        }
        next();
    })
];
exports.validar = validar;
const consultarTodos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cursoRepository = conexion_1.AppDataSource.getRepository(CursoModel_1.Curso);
        const profesorRepository = conexion_1.AppDataSource.getRepository(ProfesorModel_1.Profesor);
        const profesores = yield profesorRepository.find();
        const cursos = yield cursoRepository.find({
            relations: ['profesor'] // Cargar la relación con profesor
        });
        res.render('listarCursos', {
            pagina: 'Lista de Cursos',
            cursos,
            profesores
        });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
});
exports.consultarTodos = consultarTodos;
const consultarUno = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const idNumber = Number(id);
    if (isNaN(idNumber)) {
        throw new Error('ID inválido, debe ser un número');
    }
    try {
        const cursoRepository = conexion_1.AppDataSource.getRepository(CursoModel_1.Curso);
        const curso = yield cursoRepository.findOne({ where: { id: idNumber }, relations: ["profesor"] });
        if (curso) {
            return curso;
        }
        else {
            return null;
        }
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
exports.consultarUno = consultarUno;
const listarCursos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cursoRepository = conexion_1.AppDataSource.getRepository(CursoModel_1.Curso);
        const cursos = yield cursoRepository.find();
        return cursos ? cursos : null;
    }
    catch (err) {
        if (err instanceof Error) {
            res.render('No se ha encontrado el curso');
        }
    }
});
exports.listarCursos = listarCursos;
const insertar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errores = (0, express_validator_1.validationResult)(req);
    const profesorRepository = conexion_1.AppDataSource.getRepository(ProfesorModel_1.Profesor);
    const profesores = yield profesorRepository.find();
    if (!errores.isEmpty()) {
        return res.render('cargaCursos', {
            pagina: 'Crear Curso',
            profesores,
            errores: errores.array()
        });
    }
    const { descripcion, profesor_id, nombre } = req.body;
    try {
        yield conexion_1.AppDataSource.transaction((transactionalEntityManager) => __awaiter(void 0, void 0, void 0, function* () {
            const cursoRepository = transactionalEntityManager.getRepository(CursoModel_1.Curso);
            const profesorRepository = transactionalEntityManager.getRepository(ProfesorModel_1.Profesor);
            const existeProfesor = yield profesorRepository.findOne({ where: { id: Number(profesor_id) } });
            console.log('Profesor encontrado', existeProfesor);
            if (!existeProfesor) {
                throw new Error('El profesor no existe');
            }
            const existeCurso = yield cursoRepository.findOne({
                where: [
                    { nombre },
                    { descripcion }
                ]
            });
            if (existeCurso) {
                throw new Error('El curso ya existe');
            }
            const nuevoCurso = cursoRepository.create({ nombre, descripcion, profesor: existeProfesor });
            console.log('Nuevo curso a insertar: ', nuevoCurso);
            yield cursoRepository.save(nuevoCurso);
            res.redirect('/cursos/listarCursos');
        }));
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
});
exports.insertar = insertar;
const modificar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const idNumero = parseInt(id);
    const { descripcion, profesor_id, nombre } = req.body;
    try {
        yield conexion_1.AppDataSource.transaction((transactionEntityManager) => __awaiter(void 0, void 0, void 0, function* () {
            const profesorRepository = transactionEntityManager.getRepository(ProfesorModel_1.Profesor);
            const cursoRepository = transactionEntityManager.getRepository(CursoModel_1.Curso);
            const existeProfesor = yield profesorRepository.findOne({
                where: [
                    { id: profesor_id }
                ]
            });
            if (!existeProfesor) {
                return res.status(404).send("El profesor no existe");
            }
            const existeCurso = yield cursoRepository.findOne({
                where: [
                    { id: idNumero }
                ]
            });
            if (!existeCurso) {
                return res.status(404).send("El curso no existe");
            }
            cursoRepository.merge(existeCurso, { descripcion, profesor: existeProfesor, nombre });
            yield cursoRepository.save(existeCurso);
            return res.redirect('/cursos/listarCursos');
        }));
    }
    catch (error) {
        console.error('Error al modificar el curso:', error);
        return res.status(500).send('Error del servidor');
    }
});
exports.modificar = modificar;
const eliminar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        //console.log(`ID recibido para eliminar: ${id}`); 
        yield conexion_1.AppDataSource.transaction((transactionalEntityManager) => __awaiter(void 0, void 0, void 0, function* () {
            const cursosEstudiantesRepository = transactionalEntityManager.getRepository(CursoEstudianteModel_1.CursoEstudiante);
            const cursoRepository = transactionalEntityManager.getRepository(CursoModel_1.Curso);
            const cursosRelacionados = yield cursosEstudiantesRepository.count({ where: { curso: { id: Number(id) } } });
            if (cursosRelacionados > 0) {
                throw new Error('Hay estudiantes inscriptos a este curso. No se puede eliminar');
            }
            const deleteResult = yield cursoRepository.delete(id);
            if (deleteResult.affected === 1) {
                return res.json({ mensaje: 'Curso eliminado' });
            }
            else {
                throw new Error('Curso no encontrado');
            }
        }));
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ mensaje: err.message });
        }
        else {
            res.status(400).json({ mensaje: 'Error' });
        }
    }
});
exports.eliminar = eliminar;
