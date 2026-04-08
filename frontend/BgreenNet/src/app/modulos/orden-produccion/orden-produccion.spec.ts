import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdenProduccion } from './orden-produccion';

describe('OrdenProduccion', () => {
  let component: OrdenProduccion;
  let fixture: ComponentFixture<OrdenProduccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdenProduccion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdenProduccion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
