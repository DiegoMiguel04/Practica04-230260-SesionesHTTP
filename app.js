import express from 'express'
import session from 'express-session'
import bodyParser from 'body-parser'
import moment from 'moment-timezone'
import {v4 as uuidv4} from 'uuid'
import cors from 'cors'



// Sesiones almacenadas en Memoria (RAM)
const sessions = {}
const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors())

app.use(cors({
  origin: 'http://frontend.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(
    session({
        secret: "P4-DMRCH#u09Hjk01-SesionesHTTP",
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 5*60*1000}
    })
)

//? Obtener la IP del cliente
const getClientIP = (req) => {
    return (
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connecction.socket?.remoteAddress
    )
}

//? Iniciar sesion
app.post("/login", (req, res)=> {
    const {email, nickname, macAddress} = req.body
    if (!email || !nickname || !macAddress) {
        return res.status(400).json({message: "Se esperan campos requeridos"})
    }

    const sessionId = uuidv4()
    const now = new Date()

    sessions[sessionId] = {
        sessionId,
        email,
        nickname,
        macAddress,
        ip: getServerNetworkInfo(),
        createdAt: now,
        lastAccess: now
    }

    res.status(200).json({
        message: "Se ha logeado exitosamente",
        sessionId
    })
})

//? Cerrar la sesion
app.post("/logout", (req, res) => {
    const {sessionId} = req.body
    if (!sessionId || !session[sessionId]) {
        return res.status(404).json({message: "No se ha encntrado una sesion activa"})
    }

    delete sessions[sessionId]
    req,session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar la sesion')
        }
    })
    res.status(200).json({message:"Se ha cerrado la sesion"})
})

//? Actualizar la sesion 
app.put("/update", (req, res) => {
    const {sessionId, email, nickname} = req.body
    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({message: "No existe una sesion activa"})
    }

    if (email) sessions[sessionId].email = email
    if (nickname) sessions[sessionId].nickname = nickname
    sessions[sessionId].lastAccess = new Date()

    res.status(200).json({
        message: "La sesion ha sido actualizada",
        session: sessions[sessionId]
    })
})

//? Estado de la sesion
app.get("/status", (req, res) => {
    const sessionId = req.query.sessionId
    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({message: "No hay una sesion activa"})
    }
    
    res.status(200).json({
        message: "Sesion activa",
        session: sessions[sessionId]
    })
})

//? Estado de la sesion
app.get("/", (req, res) => {
    return res.status(200).json({
        message: "Bienvenid@ al API de Control de Sesiones",
        author:"Diego Miguel Rivera Chavez"
    })
})

const getServerNetworkInfo = () => {
    const interfaces = os.networkInterfaces()
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return {serverIp: iface.address, serverMac: iface.mac}
            }
        }
    }
}


const PORT = 3500
app.listen(PORT, () =>{
    console.log(`Servidor ejecutandose en http://localhost:${PORT}`)
})
