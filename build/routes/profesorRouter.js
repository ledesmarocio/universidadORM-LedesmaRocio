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
const profesorController_1 = require("../controllers/profesorController");
router.get('/listarProfesores', profesorController_1.consultarTodos);
//renderizo la pagina
router.get('/crearProfesores', (req, res) => {
    res.render('crearProfesores', {
        pagina: 'Crear Profesores', //titulo
    });
});
router.post('/', (0, profesorController_1.validar)(), profesorController_1.insertar);
router.get('/modificarProfesor/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profesor = yield (0, profesorController_1.consultarUno)(req, res);
        if (!profesor) {
            return res.status(404).send('Profesor no encontrado');
        }
        res.render('modificarProfesor', {
            profesor,
        });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
}));
router.put('/:id', (0, profesorController_1.validar)(), profesorController_1.modificar);
router.delete('/:id', profesorController_1.eliminar);
exports.default = router;
