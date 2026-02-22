import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet , RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected readonly title = signal('BgreenNet');

  constructor(private router: Router) {}

  ngOnInit() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' && !event.newValue) {
        this.router.navigate(['/login']);
      }
    });
  }

}
