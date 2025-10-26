import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sistemasinformacion } from './sistemasinformacion';

describe('Sistemasinformacion', () => {
  let component: Sistemasinformacion;
  let fixture: ComponentFixture<Sistemasinformacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sistemasinformacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sistemasinformacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
