import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-servicios-industriales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios-industriales.html',
  styleUrl: './servicios-industriales.css',
})
export class ServiciosIndustriales {
  selectedServicio: string = 'general';

  getServicioNombre(): string {
    switch (this.selectedServicio) {
      case 'energia': return 'Energía';
      case 'gas': return 'Gas';
      case 'vapor': return 'Vapor';
      case 'agua': return 'Agua';
      case 'general':
      default: return 'General';
    }
  }

  onServicioChange() {
    console.log('Servicio seleccionado:', this.selectedServicio);
    // Aquí podemos añadir luego la lógica para cambiar o cargar gráficas
  }
}
