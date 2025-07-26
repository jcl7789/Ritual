import { Request, Response } from 'express';

/**
 * Crea una nueva entrada de actividad para un usuario específico.
 * @param req La solicitud Express, con el userId en los parámetros y el cuerpo tipado como Entry.
 * @param res La respuesta Express.
 */
export const ping = async (req: Request, res: Response) => {
    res.status(200).json('pong');
}