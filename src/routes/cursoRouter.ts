import express from 'express';
const router = express.Router();
import { consultarTodos, consultarUno, eliminar, insertar, modificar, validar }
    from '../controllers/cursoController';
import { listarProfesores } from '../controllers/profesorController';

router.get('/listarCursos', consultarTodos);

router.get("/crearCursos", async (req, res) => {
    try {
        const profesores = await listarProfesores(req, res);
        res.render('crearCursos', {
            pagina: 'Crear cursos',
            profesores

        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json(err.message);
        }
    }
});

router.post('/', validar(), insertar);



router.get('/modificarCurso/:id', async (req, res) => {
    try {
        const curso = await consultarUno(req, res);
        const profesores = await listarProfesores(req, res);
        if (!curso) {
            return res.status(404).send('Curso no encontrado');
        }
        res.render('modificarCurso', {
            curso,
            profesores
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
});
router.put('/:id', modificar);

router.delete('/:id', eliminar);

export default router;