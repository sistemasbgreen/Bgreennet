import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { ElementRef, HostListener, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { SistemaInformacion } from '../../models/sistemasinformacion';
import { homeservices } from '../../servicios/homeservices';
import { NgIf, NgForOf } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
 imports: [NgForOf, FormsModule, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home  implements OnInit{


  user: string = '';
  sistemaInformacionData: SistemaInformacion[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router,
    private homeservice: homeservices) { }

  ngOnInit(): void {
    this.guardarname();
    this.sistemasinformacion();


  }


  irAUsuarios() {
    this.router.navigate(['/configuracion/usuarios']);
  }


  logout() {

    console.log('Cerrando sesión...');

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    this.router.navigate(['/login']);
  }

  guardarname() {
    // Verificamos que el código se ejecuta en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const usuarioString = localStorage.getItem('usuario');

      if (usuarioString) {
        const usuario = JSON.parse(usuarioString);
        this.user = usuario.usuario; // 👈 Asignamos el nombre al atributo público

      } else {
        console.log('No se encontró el usuario en localStorage');
      }
    } else {
      console.log('No se puede acceder a localStorage desde el servidor.');
    }
  }


  sistemasinformacion(): void {
    this.homeservice.getAll().subscribe({
      next: (data) => {
        this.sistemaInformacionData = data;
        console.log(data)
      },
      error: (err) => console.error('Error al cargar sistemas de informacion', err)
    });
  }


}
