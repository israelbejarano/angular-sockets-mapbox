import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Lugar } from '../../interfaces/interfaces';
import { WebsocketService } from '../../services/websocket.service';

import * as mapboxgl from 'mapbox-gl';

interface RespMarcadores {
  [key: string]: Lugar;
}

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements OnInit {

  mapa: mapboxgl.Map;

  // esto era para el principio solo
  // lugares: Lugar[] = [];
  lugares: RespMarcadores;
  markersMapbox: {[id: string]: mapboxgl.Marker} = {};

  constructor(private http: HttpClient, private wsService: WebsocketService) { }

  ngOnInit() {
    this.http.get<RespMarcadores>('http://localhost:5000/mapbox/mapa').subscribe(lugares => {
      console.log(lugares);
      this.lugares = lugares;
      this.crearMapa();
    });
    this.escucharSockets();
  }

  escucharSockets() {
    this.wsService.listen('mb-marcador-nuevo').subscribe((marcador: Lugar) => {
      console.log(marcador);
      this.agregarMarcador(marcador);
    });

    this.wsService.listen('mb-marcador-mover').subscribe((marcador: Lugar) => {
      this.markersMapbox[marcador.id].setLngLat([marcador.lng, marcador.lat]);
    });

    this.wsService.listen('mb-marcador-borrar').subscribe((id: string) => {
      this.markersMapbox[id].remove();
      delete this.markersMapbox[id];
    });
  }

  crearMapa() {
    (mapboxgl as any).accessToken = 'pk.eyJ1IjoiaXNyYWVsYmEiLCJhIjoiY2p6cjFvYmZlMHk3azNrbG0yODdjcTBkMCJ9.rQHGRKKilUn8zDx6vyijlA';
    this.mapa = new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-75.75512993582937, 45.349977429009954],
      zoom: 15.8
    });

    // [key, marcador] destructuracion de arrays
    for(const [key, marcador] of Object.entries (this.lugares)) {
      this.agregarMarcador(marcador);
    }
  }

  agregarMarcador(marcador: Lugar) {
    // mostrar popup para saber que marcador se esta moviendo
    // para impl el borrar no podemos usar este html
    /* const html = `<h2>${marcador.nombre}</h2>
                  <br>
                  <button>Borrar</button>`; */

    const h2 = document.createElement('h2');
    h2.innerText = marcador.nombre;

    const btnBorrar = document.createElement('button');
    btnBorrar.innerText = 'Borrar';

    const div = document.createElement('div');
    div.append(h2, btnBorrar);

    const customPopup = new mapboxgl.Popup({
      offset: 25,
      closeOnClick: false
    }).setDOMContent(div);
    const marker = new mapboxgl.Marker({
      draggable: true,
      color: marcador.color
    })
    .setLngLat([marcador.lng, marcador.lat])
    .setPopup(customPopup)
    .addTo(this.mapa);

    marker.on('drag', () => {
      const lngLat = marker.getLngLat();
      console.log(lngLat);
      const nuevoMarcador = {
        id: marcador.id,
        ...lngLat
      };
      this.wsService.emit('mb-marcador-mover', nuevoMarcador);
    });

    btnBorrar.addEventListener('click', () => {
      marker.remove();
      this.wsService.emit('mb-marcador-borrar', marcador.id);
    });
    this.markersMapbox[marcador.id] = marker;
  }

  crearMarcador() {
    const customMarker: Lugar = {
      id: new Date().toISOString(),
      lng: -75.75512993582937,
      lat: 45.349977429009954,
      nombre: 'Sin Nombre',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    };

    this.agregarMarcador(customMarker);

    // emitir marcador nuevo
    this.wsService.emit('mb-marcador-nuevo', customMarker);
  }

}
