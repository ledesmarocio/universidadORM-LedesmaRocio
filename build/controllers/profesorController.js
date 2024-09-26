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
exports.eliminar = exports.modificar = exports.insertar = exports.listarProfesores = exports.consultarUno = exports.listaProfesores = exports.consultarTodos = exports.validar = void 0;
const express_validator_1 = require("express-validator");
const ProfesorModel_1 = require("../models/ProfesorModel");
const conexion_1 = require("../db/conexion");
const CursoModel_1 = require("../models/CursoModel");
var profesores;
const validar = () => [
    (0, express_validator_1.check)('dni')
        .notEmpty().withMessage('El DNI es obligatorio')
        .isLength({ min: 7 }).withMessage('El DNI debe tener al menos 7 caracteres')
        .isNumeric().withMessage('El dni del profesor debe ser un número'),
    (0, express_validator_1.check)('nombre').notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 3 }).withMessage('El Nombre debe tener al menos 3 caracteres')
        .matches(/^[a-zA-Z\s]+$/).withMessage('El nombre del curso solo puede contener letras'),
    (0, express_validator_1.check)('apellido').notEmpty().withMessage('El apellido es obligatorio')
        .matches(/^[a-zA-Z\s]+$/).withMessage('El apellido del profesor solo puede contener letras')
        .isLength({ min: 3 }).withMessage('El Apellido debe tener al menos 3 caracteres'),
    (0, express_validator_1.check)('email').isEmail().withMessage('Debe proporcionar un email válido')
        .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
    (0, express_validator_1.check)('profesion').notEmpty().withMessage('Debe tener una profesión asignada')
        .matches(/^[a-zA-Z\s]+$/).withMessage('La profesión solo puede contener letras'),
    (0, express_validator_1.check)('telefono')
        .notEmpty()
        .isLength({ min: 10 })
        .withMessage('Debe insertar un número de teléfono')
        .isNumeric().withMessage('El telefono del profesor debe ser un número'),
    (req, res, next) => {
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            return res.render('crearProfesores', {
                pagina: 'Crear Profesores',
                errores: errores.array()
            });
        }
        next();
    }
];
exports.validar = validar;
const consultarTodos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profesorRepository = conexion_1.AppDataSource.getRepository(ProfesorModel_1.Profesor);
        const profesores = yield profesorRepository.find();
        res.render('listarProfesores', {
            pagina: 'Lista de Profesores',
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
const listaProfesores = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profesorRepository = conexion_1.AppDataSource.getRepository(ProfesorModel_1.Profesor);
        const profesores = yield profesorRepository.find();
        return profesores; // Siempre devolverá un array, aunque esté vacío
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
            throw err; // Lanzar el error de nuevo si es necesario manejarlo más arriba
        }
        throw new Error('Error desconocido'); // Para cualquier otro tipo de error
    }
});
exports.listaProfesores = listaProfesores;
const consultarUno = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const idNumber = Number(id);
    if (isNaN(idNumber)) {
        throw new Error('ID inválido, debe ser un número');
    }
    try {
        const profesorRepository = conexion_1.AppDataSource.getRepository(ProfesorModel_1.Profesor);
        const profesor = yield profesorRepository.findOne({ where: { id: idNumber } });
        if (profesor) {
            return profesor;
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
const listarProfesores = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profesorRepository = conexion_1.AppDataSource.getRepository(ProfesorModel_1.Profesor);
        const profesores = yield profesorRepository.find();
        return profesores ? profesores : null;
    }
    catch (err) {
        if (err instanceof Error) {
            res.render('No se ha encontrado el profesor');
        }
    }
});
exports.listarProfesores = listarProfesores;
const insertar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errores = (0, express_validator_1.validationResult)(req);
    if (!errores.isEmpty()) {
        return res.render('cargaProfesores', {
            pagina: 'Crear Profesores',
            errores: errores.array()
        });
    }
    const { dni, nombre, apellido, email, profesion, telefono } = req.body;
    try {
        yield conexion_1.AppDataSource.transaction((transactionalEntityManager) => __awaiter(void 0, void 0, void 0, function* () {
            const profesorRepository = transactionalEntityManager.getRepository(ProfesorModel_1.Profesor);
            const existeProfesor = yield profesorRepository.findOne({
                where: [
                    { dni },
                    { email }
                ]
            });
            if (existeProfesor) {
                throw new Error('El profesor ya existe.');
            }
            const nuevoProfesor = profesorRepository.create({ dni, nombre, apellido, email, profesion, telefono });
            yield profesorRepository.save(nuevoProfesor);
        }));
        const profesores = yield conexion_1.AppDataSource.getRepository(ProfesorModel_1.Profesor).find();
        res.render('listarProfesores', {
            pagina: 'Lista de Profesores',
            profesores
        });
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
    const { dni, nombre, apellido, email, profesion, telefono } = req.body;
    try {
        const profesorRepository = conexion_1.AppDataSource.getRepository(ProfesorModel_1.Profesor);
        const profesor = yield profesorRepository.findOne({ where: { id: parseInt(id) } });
        if (!profesor) {
            return res.status(404).send('profesor no encontrado');
        }
        profesorRepository.merge(profesor, { dni, nombre, apellido, email, profesion, telefono });
        yield profesorRepository.save(profesor);
        return res.redirect('/profesores/listarProfesores');
    }
    catch (error) {
        console.error('Error al modificar el profesor:', error);
        return res.status(500).send('Error del servidor acaaaaaaaaaaa');
    }
});
exports.modificar = modificar;
const eliminar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        //console.log(`ID recibido para eliminar: ${id}`); 
        yield conexion_1.AppDataSource.transaction((transactionalEntityManager) => __awaiter(void 0, void 0, void 0, function* () {
            const cursoRepository = transactionalEntityManager.getRepository(CursoModel_1.Curso); //conectar con tabla curso
            const profesorRepository = transactionalEntityManager.getRepository(ProfesorModel_1.Profesor);
            const cursosRelacionados = yield cursoRepository.count({ where: { profesor: { id: Number(id) } } });
            if (cursosRelacionados > 0) {
                throw new Error('Profesor dictando materias, no se puede eliminar');
            }
            const deleteResult = yield profesorRepository.delete(id);
            if (deleteResult.affected === 1) {
                return res.json({ mensaje: 'Profesor eliminado' });
            }
            else {
                throw new Error('Profesor no encontrado');
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
