// Archivo principal de la aplicación Express.
// Configura el servidor, la conexión a la base de datos y las rutas.
import express from 'express';
import cors from 'cors'; // Importa cors para permitir solicitudes desde el frontend
import dotenv from 'dotenv'; // Para cargar variables de entorno
import connectDB from './src/config/db'; // Importa la función de conexión a la base de datos
import userEntryRoutes from './src/routes/userEntryRoutes'; // Importa las rutas de entrada de usuario (renombradas)
import healthRoutes from './src/routes/healthRoutes';

dotenv.config(); // Carga las variables de entorno

const app = express();
const PORT = process.env.PORT || 5000; // Puerto del servidor, por defecto 5000

// Conectar a la base de datos MongoDB
connectDB();

// Middlewares
app.use(cors()); // Habilita CORS para permitir solicitudes desde el frontend
app.use(express.json()); // Permite que Express parsee el cuerpo de las solicitudes como JSON

// Rutas de la API
// Las rutas de entradas ahora están anidadas bajo /api/users para incluir el userId
app.use('', healthRoutes);
app.use('/api/users', userEntryRoutes); // Monta las rutas de entrada de usuario bajo /api/users


// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de Ritual está funcionando!');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor de Ritual corriendo en el puerto ${PORT}`);
});