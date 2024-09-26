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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cursoController_1 = require("../controllers/cursoController");
const estudianteController_1 = require("../controllers/estudianteController");
const router = express_1.default.Router();
const inscripcionController_1 = require("../controllers/inscripcionController");
router.get('/listarInscripciones', inscripcionController_1.consultarTodos);
//router.get('/xAlumno/:id',consultarxAlumno );
//router.get('/xCurso/:id',consultarxCurso );
router.get('/crearInscripciones', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cursos = yield (0, cursoController_1.listarCursos)(req, res);
        const estudiantes = yield (0, estudianteController_1.listarEstudiantes)(req, res);
        res.render('crearInscripciones', {
            pagina: 'Crear Inscripción',
            cursos,
            estudiantes
        });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).json(err.message);
        }
    }
}));
router.post('/', (0, inscripcionController_1.validar)(), inscripcionController_1.inscribir);
router.get('/modificarInscripcion/:curso_id/:estudiante_id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inscripcion = yield (0, inscripcionController_1.consultarUnaInscripcion)(req, res);
        if (!inscripcion) {
            return res.status(404).send('No se encontró la inscripción');
        }
        res.render('modificarInscripcion', {
            inscripcion,
        });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
}));
router.put('/:curso_id/:estudiante_id', inscripcionController_1.modificarNota);
router.delete('/:curso_id/:estudiante_id', inscripcionController_1.eliminar);
exports.default = router;
