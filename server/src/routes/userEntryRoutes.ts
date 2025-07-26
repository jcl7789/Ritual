// Define las rutas de la API para las operaciones de entrada de usuario.
import { Router } from 'express';
import {
  createEntryForUser,
  getEntriesForUser,
  getEntryForUserById,
  updateEntryForUser,
  deleteEntryForUser,
} from '../controllers/userEntryController'; // Importa el controlador de entradas de usuario

const router = Router();

// Rutas para las entradas de actividad de un usuario específico
// Las rutas ahora incluyen :userId para identificar al usuario
router.post('/:userId/entries', createEntryForUser); // POST /api/users/:userId/entries - Crear una nueva entrada para un usuario
router.get('/:userId/entries', getEntriesForUser);    // GET /api/users/:userId/entries - Obtener todas las entradas de un usuario (o filtrar)
router.get('/:userId/entries/:entryId', getEntryForUserById); // GET /api/users/:userId/entries/:entryId - Obtener una entrada específica por ID
router.put('/:userId/entries/:entryId', updateEntryForUser);  // PUT /api/users/:userId/entries/:entryId - Actualizar una entrada específica por ID
router.delete('/:userId/entries/:entryId', deleteEntryForUser); // DELETE /api/users/:userId/entries/:entryId - Eliminar una entrada específica por ID

export default router;