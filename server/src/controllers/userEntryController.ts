// Contiene la lógica de negocio para manejar las operaciones CRUD de las entradas dentro de un usuario.
import { Request, Response } from 'express';
import User, { UserDocument } from '../models/User'; // Importa el modelo User y UserDocument
import { CreateEntryInput, EntryFilters, Entry, EntrySubdocument, SavedEntry } from '@shared/types'; // Importa las interfaces compartidas y EntrySubdocument
import mongoose from 'mongoose'; // Necesario para ObjectId

/**
 * Crea una nueva entrada de actividad para un usuario específico.
 * @param req La solicitud Express, con el userId en los parámetros y el cuerpo tipado como Entry.
 * @param res La respuesta Express.
 */
export const createEntryForUser = async (req: Request<{ userId: string }, {}, Entry>, res: Response) => {
  try {
    const userId = parseInt(req.params.userId); // Obtiene el userId de los parámetros de la URL
    const { id, date, activityType, partner, duration, satisfaction, notes } = req.body;

    // Valida que los datos esenciales estén presentes
    // Ahora se valida activityType.key en lugar de activityType.name
    if (!date || !activityType || !activityType.id) {
      return res.status(400).json({ message: 'Faltan campos obligatorios para la entrada o el tipo de actividad.' });
    }

    // Busca el usuario por userId
    let user: UserDocument | null = await User.findOne({ userId }); // ¡Cast explícito!

    // Si el usuario no existe, lo crea
    if (!user) {
      user = new User({ userId, entries: [] });
      await user.save(); // Guarda el nuevo usuario
      console.log(`Usuario con ID ${userId} creado.`);
    }

    // Crea la nueva entrada
    const newEntry: Entry = {
      id,
      date: new Date(date),
      activityType,
      partner,
      duration,
      satisfaction,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Añade la nueva entrada al array de entradas del usuario
    user.entries.push(newEntry);
    await user.save(); // Guarda el usuario con la nueva entrada

    // Obtener la entrada recién guardada con su _id generado por Mongoose
    const savedEntry = user.entries[user.entries.length - 1] as EntrySubdocument;

    // Responde con la entrada creada y un estado 201 (Creado)
    // Aseguramos que el 'id' de la respuesta sea el '_id' generado por Mongoose
    res.status(201).json({ ...savedEntry.toObject(), id: savedEntry._id.toString() });
  } catch (error: any) {
    // Manejo de errores
    console.error('Error al crear la entrada para el usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear la entrada.', error: error.message });
  }
};

/**
 * Obtiene todas las entradas de actividad para un usuario específico, con opciones de filtrado.
 * @param req La solicitud Express, con el userId en los parámetros y query params para EntryFilters.
 * @param res La respuesta Express.
 */
export const getEntriesForUser = async (req: Request<{ userId: string }, {}, {}, EntryFilters>, res: Response) => {
  try {
    const userId = parseInt(req.params.userId); // Obtiene el userId de los parámetros de la URL
    const { startDate, endDate, activityTypes, minSatisfaction, partner } = req.query;

    // Busca el usuario por userId
    const user: UserDocument | null = await User.findOne({ userId }); // ¡Cast explícito!

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Asegura que filteredEntries sea un array de EntrySubdocument
    let filteredEntries: EntrySubdocument[] = user.entries as EntrySubdocument[];

    // Aplicar filtros
    if (startDate) {
      // Convertir a unknown primero para satisfacer a TypeScript
      const start = new Date(startDate as unknown as string);
      filteredEntries = filteredEntries.filter(entry => entry.date >= start);
    }
    if (endDate) {
      // Convertir a unknown primero para satisfacer a TypeScript
      const end = new Date(endDate as unknown as string);
      filteredEntries = filteredEntries.filter(entry => entry.date <= end);
    }
    if (activityTypes && activityTypes.length > 0) {
      const typesArray = Array.isArray(activityTypes) ? activityTypes : (activityTypes as string).split(',');
      // Filtrar por activityType.id
      filteredEntries = filteredEntries.filter(entry => typesArray.includes(entry.activityType.id));
    }
    if (minSatisfaction) {
      const minSat = parseInt(minSatisfaction as unknown as string);
      filteredEntries = filteredEntries.filter(entry => entry.satisfaction && entry.satisfaction >= minSat);
    }
    if (partner) {
      const partnerRegex = new RegExp(partner as string, 'i');
      filteredEntries = filteredEntries.filter(entry => entry.partner && partnerRegex.test(entry.partner));
    }

    // Ordenar por fecha descendente
    filteredEntries.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Mapear _id a id para que coincida con la interfaz Entry
    const entriesResponse = filteredEntries.map(entry => ({
      ...entry.toObject(), // Ahora toObject() es reconocido
      id: entry._id.toString() // Mapea _id a id
    }));

    res.status(200).json(entriesResponse);
  } catch (error: any) {
    console.error('Error al obtener las entradas para el usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener las entradas.', error: error.message });
  }
};

/**
 * Obtiene una entrada específica por su ID para un usuario dado.
 * @param req La solicitud Express, con userId y entryId en los parámetros.
 * @param res La respuesta Express.
 */
export const getEntryForUserById = async (req: Request<{ userId: string, entryId: string }>, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const entryId = req.params.entryId;

    const user: UserDocument | null = await User.findOne({ userId }); // ¡Cast explícito!

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Busca la entrada por su _id dentro del array de entradas del usuario
    const entry: EntrySubdocument | null = user.entries.id(entryId) as EntrySubdocument | null; // Casteo a EntrySubdocument

    if (!entry) {
      return res.status(404).json({ message: 'Entrada no encontrada para este usuario.' });
    }

    // Mapear _id a id para que coincida con la interfaz Entry
    const entryResponse: Entry = {
      ...entry.toObject(),
      id: entry._id.toString()
    };

    res.status(200).json(entryResponse);
  } catch (error: any) {
    console.error('Error al obtener la entrada por ID para el usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener la entrada por ID.', error: error.message });
  }
};

/**
 * Actualiza una entrada existente para un usuario específico.
 * @param req La solicitud Express, con userId y entryId en los parámetros y los datos de actualización en el cuerpo.
 * @param res La respuesta Express.
 */
export const updateEntryForUser = async (req: Request<{ userId: string, entryId: string }, {}, Partial<Entry>>, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const entryId = req.params.entryId;
    const updateData = req.body;

    const user: UserDocument | null = await User.findOne({ userId }); // ¡Cast explícito!

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const entry: EntrySubdocument | null = user.entries.id(entryId) as EntrySubdocument | null; // Casteo a EntrySubdocument

    if (!entry) {
      return res.status(404).json({ message: 'Entrada no encontrada para actualizar.' });
    }

    // Actualiza los campos de la entrada
    Object.assign(entry, updateData);
    entry.updatedAt = new Date(); // Actualiza la fecha de modificación de la entrada

    await user.save(); // Guarda el documento User con la entrada actualizada

    // Mapear _id a id para que coincida con la interfaz Entry
    const updatedEntryResponse: Entry = {
      ...entry.toObject(),
      id: entry._id.toString()
    };

    res.status(200).json(updatedEntryResponse);
  } catch (error: any) {
    console.error('Error al actualizar la entrada para el usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar la entrada.', error: error.message });
  }
};

/**
 * Elimina una entrada específica para un usuario dado.
 * @param req La solicitud Express, con userId y entryId en los parámetros.
 * @param res La respuesta Express.
 */
export const deleteEntryForUser = async (req: Request<{ userId: string, entryId: string }>, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const entryId = req.params.entryId;

    const user: UserDocument | null = await User.findOne({ userId }); // ¡Cast explícito!

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Elimina el subdocumento del array
    user.entries.pull({ _id: new mongoose.Types.ObjectId(entryId) }); // ¡CORREGIDO! Usar ObjectId para pull

    await user.save(); // Guarda el documento User con la entrada eliminada

    res.status(200).json({ message: 'Entrada eliminada exitosamente.' });
  } catch (error: any) {
    console.error('Error al eliminar la entrada para el usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar la entrada.', error: error.message });
  }
};