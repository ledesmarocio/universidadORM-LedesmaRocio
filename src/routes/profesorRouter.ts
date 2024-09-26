import express from 'express';
const router = express.Router();
import { consultarTodos, consultarUno, eliminar, insertar, modificar, validar }
    from '../controllers/profesorController';

router.get('/listarProfesores', consultarTodos);

//renderizo la pagina
router.get('/crearProfesores', (req,res)=>{
    res.render('crearProfesores', {
        pagina: 'Crear Profesores', //titulo
    });
})

router.post('/', validar(), insertar);

router.get('/modificarProfesor/:id', async(req,res)=>{
    try{
        const profesor= await consultarUno(req,res);
        if(!profesor){
            return res.status(404).send('Profesor no encontrado')
        }
        res.render('modificarProfesor', {
            profesor,
        });
    } catch(err:unknown){
        if(err instanceof Error){
            res.status(500).send(err.message);
        }
    }
});

router.put('/:id',validar(), modificar);

router.delete('/:id', eliminar);

export default router;