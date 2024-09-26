import express from 'express';
import { listarCursos } from '../controllers/cursoController';
import { listarEstudiantes } from '../controllers/estudianteController';
const router=express.Router();
import { consultarTodos, consultarUnaInscripcion, eliminar,inscribir,modificarNota,validar } from '../controllers/inscripcionController';

router.get('/listarInscripciones',consultarTodos);
//router.get('/xAlumno/:id',consultarxAlumno );
//router.get('/xCurso/:id',consultarxCurso );

router.get('/crearInscripciones', async (req, res) => {
    try{
        const cursos= await listarCursos(req,res);
        const estudiantes= await listarEstudiantes(req,res);
        res.render('crearInscripciones', {
            pagina: 'Crear Inscripción',
            cursos,
            estudiantes
        });
    }catch(err: unknown) {
        if (err instanceof Error) {
            res.status(500).json(err.message);
        }

    }
    
});

router.post('/',validar(), inscribir);

router.get('/modificarInscripcion/:curso_id/:estudiante_id', async(req,res)=>{
    try{
        const inscripcion= await consultarUnaInscripcion(req,res);
        if(!inscripcion){
            return res.status(404).send('No se encontró la inscripción');
        }
        res.render('modificarInscripcion', {
            inscripcion,
        });
    }catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
});

router.put('/:curso_id/:estudiante_id',modificarNota);

router.delete('/:curso_id/:estudiante_id',eliminar);

export default router;