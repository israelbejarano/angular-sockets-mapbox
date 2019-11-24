import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

// sockets
import { SocketIoModule } from 'ngx-socket-io';

import { AppComponent } from './app.component';
import { MapaComponent } from './components/mapa/mapa.component';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    MapaComponent
  ],
  imports: [
    BrowserModule,
    SocketIoModule.forRoot(environment.socketConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
