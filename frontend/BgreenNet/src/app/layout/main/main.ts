import { Component } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-main',
  imports: [],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {



  constructor(private router: Router) { }


  logout() {

    console.log('Cerrando sesión...');
    localStorage.removeItem('token');
    
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);

  }

}
