// Definición del modelo Mongoose para los usuarios, que contendrá las entradas como subdocumentos.
import { Schema, model, Document, Types } from 'mongoose'; // Importa Types aquí también
import { Entry, User } from '../../../shared/types';

// Esquema para el subdocumento Entry
// Mongoose automáticamente añade un _id a los subdocumentos.
const EntrySchema = new Schema<Entry>({
  // 'id' de la interfaz Entry se mapeará al '_id' de Mongoose para subdocumentos
  // No es necesario definirlo explícitamente aquí si quieres que Mongoose lo genere
  // Si quieres un 'id' personalizado, deberías definirlo y gestionar su unicidad
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  activityType: {
    id: { type: String, required: true },
  },
  partner: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  duration: {
    type: Number,
    min: 0, // Duración no puede ser negativa
  },
  satisfaction: {
    type: Number,
    min: 1,
    max: 5,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
}, {
  timestamps: true, // Añade automáticamente campos createdAt y updatedAt para cada entrada
});

// Extiende la interfaz User con Document de Mongoose
// Define explícitamente 'entries' para asegurar que TypeScript lo reconozca como DocumentArray
export interface UserDocument extends Document {
  userId: number;
  entries: Types.DocumentArray<Entry>; // Usamos Entry aquí, ya que EntrySubdocument es para cuando ya es un subdocumento
  createdAt?: Date;
  updatedAt?: Date;
}

// Esquema principal para el modelo User
const UserSchema = new Schema<UserDocument>({
  userId: {
    type: Number,
    required: true,
    unique: true, // Asegura que cada userId sea único
    index: true, // Crea un índice para búsquedas rápidas por userId
  },
  entries: [EntrySchema], // Define 'entries' como un array de subdocumentos EntrySchema
}, {
  timestamps: true, // Añade automáticamente campos createdAt y updatedAt para el documento User
});

// Crea y exporta el modelo Mongoose
const User = model<UserDocument>('User', UserSchema);

export default User;