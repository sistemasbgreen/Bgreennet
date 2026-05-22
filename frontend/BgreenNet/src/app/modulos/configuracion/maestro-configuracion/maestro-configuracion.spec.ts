import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaestroConfiguracion } from './maestro-configuracion';

describe('MaestroConfiguracion', () => {
  let component: MaestroConfiguracion;
  let fixture: ComponentFixture<MaestroConfiguracion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaestroConfiguracion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaestroConfiguracion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
