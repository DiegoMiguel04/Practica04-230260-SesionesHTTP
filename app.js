import express from 'express'
import session from 'express-session'
import bodyParser from 'body-parser'
import moment from 'moment-timezone'
import { v4 as uuidv4 } from 'uuid'
import cors from 'cors'
import os from 'os'

const app = express()
app.use(express.json())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))

const sessions = {}

app.use(
    session({
        secret: "P4-DMRCH#u09Hjk01-SesionesHTTP",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 10*60*1000 }
    })
)

//? Función para obtener la IP`
const getLocalIp = () => {
    const interfaces = os.networkInterfaces()
    for (const interfaceName in interfaces) {
        const interfacesK = interfaces[interfaceName]
        for (const iface of interfacesK) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address
            }
        }
    }
    return null
}

//? Iniciar sesión
app.post('/login', (req, res) => {
    const { email, nickname, macAddress } = req.body
    if (!email || !nickname) {
        return res.status(400).json({ message: 'Falta algún campo.' })
    }

    if (Object.values(sessions).some(session => session.email === email && session.status === 'activa')) {
        return res.status(400).json({ message: 'Ya hay una sesión activa para este usuario.' })
    }

    const sessionId = uuidv4()
    const now = new Date()
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const serverIp = getLocalIp()

    sessions[sessionId] = {
        sessionId,
        email,
        nickname,
        createdAt: now,
        lastAccessedAt: now,
        clientIp,
        clientMac: macAddress,
        serverIp,
        status: 'activa'
    }

    req.session.sessionId = sessionId
    res.status(200).json({ message: 'Inicio de sesión exitoso.', sessionId })
})

//? Cerrar sesión
app.post('/logout', (req, res) => {
    const { sessionId } = req.body
    if (!sessionId || !sessions[sessionId]) {
        return res.status(400).json({ message: 'Sesión no válida.' })
    }

    delete sessions[sessionId]
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error al cerrar la sesión.' })
        }
        res.status(200).json({ message: 'Sesión cerrada con éxito.' })
    })
})

//? Actualizar sesión
app.put('/update', (req, res) => {
    const { sessionId, email, nickname } = req.body
    if (!sessionId || !sessions[sessionId]) {
        return res.status(400).json({ message: 'Sesión no válida.' })
    }

    sessions[sessionId].email = email
    sessions[sessionId].nickname = nickname
    sessions[sessionId].lastAccessedAt = new Date()
    sessions[sessionId].inactivity = `${Math.floor(inactivity.asMinutes())} minutos y ${inactivity.seconds()} segundos`

    res.status(200).json({ message: 'Sesión actualizada.', session: sessions[sessionId] })
})

//? Listar sesiones activas
app.get('/listCurrentSessions', (req, res) => {
    const activeSessions = Object.values(sessions).filter(session => session.status === 'activa')
    res.status(200).json({ activeSessions })
})

//? Estado de la sesión
app.get('/status', (req, res) => {
    const { sessionId } = req.query
    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ message: 'No hay sesión activa.' })
    }

    const session = sessions[sessionId]
    const mexicoTime = moment().tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss')
    const timeElapsed = moment().diff(moment(session.createdAt), 'seconds')
    const minutes = Math.floor(timeElapsed / 60)
    const seconds = timeElapsed % 60

    res.status(200).json({
        message: 'Sesión activa.',
        session: {
            ...session,
            createdAt: mexicoTime,
            lastAccessedAt: mexicoTime,
            timeElapsed: `${minutes} minutos y ${seconds} segundos`
        }
    })
})

//? Obtener la IP
app.get('/ip', (req, res) => {
    const localIp = getLocalIp()
    if (localIp) {
        res.status(200).json({ localIp })
    } else {
        res.status(500).json({ message: 'No se pudo obtener la IP local.' })
    }
})

//? Ruta de bienvenida
app.get('/', (req, res) => {
    return res.status(200).json({
        message: "Bienvenid@ al API de Control de Sesiones",
        author: "Diego Miguel Rivera Chavez"
    })
})

//? Iniciar servidor
app.listen(3007, () => {
    console.log('Servidor alojado en el puerto 3007')
})
