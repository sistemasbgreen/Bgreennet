import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosIndustriales } from './servicios-industriales';

describe('ServiciosIndustriales', () => {
  let component: ServiciosIndustriales;
  let fixture: ComponentFixture<ServiciosIndustriales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciosIndustriales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosIndustriales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
