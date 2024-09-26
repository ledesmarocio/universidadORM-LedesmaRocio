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
const router = express_1.default.Router();
const cursoController_1 = require("../controllers/cursoController");
const profesorController_1 = require("../controllers/profesorController");
router.get('/listarCursos', cursoController_1.consultarTodos);
router.get("/crearCursos", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profesores = yield (0, profesorController_1.listarProfesores)(req, res);
        res.render('crearCursos', {
            pagina: 'Crear cursos',
            profesores
        });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).json(err.message);
        }
    }
}));
router.post('/', (0, cursoController_1.validar)(), cursoController_1.insertar);
router.get('/modificarCurso/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const curso = yield (0, cursoController_1.consultarUno)(req, res);
        const profesores = yield (0, profesorController_1.listarProfesores)(req, res);
        if (!curso) {
            return res.status(404).send('Curso no encontrado');
        }
        res.render('modificarCurso', {
            curso,
            profesores
        });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
}));
router.put('/:id', cursoController_1.modificar);
router.delete('/:id', cursoController_1.eliminar);
exports.default = router;
