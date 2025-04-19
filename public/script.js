window.onload = async () => {
    try {
        const response = await fetch('/api/departamentos');
        const departamentos = await response.json();
        
        const origenSelect = document.getElementById('origen');
        const destinoSelect = document.getElementById('destino');
        
        origenSelect.innerHTML = '<option value="">Seleccione origen</option>';
        destinoSelect.innerHTML = '<option value="">Seleccione destino</option>';
        
        departamentos.forEach(depto => {
            origenSelect.add(new Option(depto, depto));
            destinoSelect.add(new Option(depto, depto));
        });
    } catch (error) {
        console.error('Error cargando departamentos:', error);
        alert('Error al cargar los departamentos');
    }
};

async function buscarRuta() {
    const origen = document.getElementById('origen').value;
    const destino = document.getElementById('destino').value;
    
    if (!origen || !destino) {
        alert('Por favor seleccione origen y destino');
        return;
    }
    
    try {
        const response = await fetch(`/api/ruta?origen=${encodeURIComponent(origen)}&destino=${encodeURIComponent(destino)}`);
        const data = await response.json();
        
        const resultado = document.getElementById('resultado');
        
        if (data.ruta && data.ruta.length > 0) {
            resultado.innerHTML = `
                <div class="ruta-info">
                    <h3>Ruta encontrada</h3>
                    <div class="ruta-path">
                        ${data.ruta.join(' → ')}
                    </div>
                    <div class="distancia-info">
                        Distancia total: ${data.distanciaTotal} kilómetros
                    </div>
                </div>
            `;
        } else {
            resultado.innerHTML = `
                <div class="ruta-info">
                    <h3>No se encontró ruta</h3>
                    <p>No existe una ruta disponible entre los departamentos seleccionados.</p>
                </div>
            `;
        }
        resultado.classList.remove('hidden');
        resultado.classList.add('visible');
    } catch (error) {
        console.error('Error buscando ruta:', error);
        alert('Error al buscar la ruta');
    }
}

function verMapa() {
    window.location.href = 'mapa.html';
}