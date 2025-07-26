import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Carga las variables de entorno desde .env

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI; // Obtiene la URI de MongoDB de las variables de entorno

    if (!mongoUri) {
      console.error('Error: La variable de entorno MONGO_URI no está definida.');
      process.exit(1); // Sale de la aplicación si la URI no está configurada
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB conectado exitosamente...');
  } catch (err: any) {
    console.error(`Error al conectar MongoDB: ${err.message}`);
    process.exit(1); // Sale de la aplicación si la conexión falla
  }
};

export default connectDB;