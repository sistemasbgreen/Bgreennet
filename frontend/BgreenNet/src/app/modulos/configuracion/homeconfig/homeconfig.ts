import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homeconfig',
  imports: [],
  templateUrl: './homeconfig.html',
  styleUrl: './homeconfig.css',
})
export class Homeconfig {
  constructor(private router: Router) {}

  navigateTo(module: string) {
    let path = module;
    if (module === 'sistemas') path = 'sistemasinformacion';
    if (module === 'metas') path = 'metas-cmi';
    if (module === 'seguridad') path = 'maestro-configuracion';
    if (module === 'variables') path = 'seguimiento-variable';
    
    this.router.navigate([`/app/configuracion/${path}`]);
  }
}
