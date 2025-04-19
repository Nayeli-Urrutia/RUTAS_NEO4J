require('dotenv').config();
const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexión a Neo4j
const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// Verificación inicial de la conexión
const verificarConexion = async () => {
    const session = driver.session();
    try {
        const result = await session.run('MATCH (n:Departamento) RETURN count(n) as count');
        const count = result.records[0].get('count').toNumber();
        console.log(`Conexión exitosa a Neo4j. Se encontraron ${count} departamentos`);
    } catch (error) {
        console.error('Error de conexión a Neo4j:', error);
        process.exit(1);
    } finally {
        await session.close();
    }
};

verificarConexion();

// Ruta para obtener todos los departamentos
app.get('/api/departamentos', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (d:Departamento) 
            RETURN d.nombre as nombre 
            ORDER BY nombre
        `);
        
        const departamentos = result.records.map(record => {
            const nombre = record.get('nombre');
            return nombre ? nombre.replace(/^"|"$/g, '').trim() : null;
        }).filter(Boolean);

        console.log('Departamentos encontrados:', departamentos);
        res.json(departamentos);
    } catch (error) {
        console.error('Error al obtener departamentos:', error);
        res.status(500).json({ 
            error: error.message,
            mensaje: 'Error al obtener los departamentos' 
        });
    } finally {
        await session.close();
    }
});

// Ruta para encontrar la ruta más corta
app.get('/api/ruta', async (req, res) => {
    const { origen, destino } = req.query;
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH path = shortestPath((inicio:Departamento {nombre: $origen})-[:CARRETERA*]->(fin:Departamento {nombre: $destino}))
            WITH path, 
                 [node IN nodes(path) | node.nombre] AS nombres,
                 reduce(dist = 0, r IN relationships(path) | dist + r.distancia) AS distanciaTotal
            RETURN nombres, distanciaTotal
        `, { origen, destino });

        if (result.records.length === 0) {
            res.json({ 
                ruta: [], 
                distanciaTotal: 0,
                mensaje: 'No se encontró una ruta entre los departamentos seleccionados.'
            });
        } else {
            const ruta = result.records[0].get('nombres');
            const distanciaTotal = result.records[0].get('distanciaTotal').toNumber();
            res.json({ 
                ruta, 
                distanciaTotal,
                mensaje: 'Ruta encontrada exitosamente'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: error.message,
            mensaje: 'Error al buscar la ruta'
        });
    } finally {
        await session.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Cierre limpio de la conexión
process.on('SIGTERM', async () => {
    await driver.close();
    process.exit(0);
});