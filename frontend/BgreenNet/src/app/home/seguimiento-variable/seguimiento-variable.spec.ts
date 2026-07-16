import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeguimientoVariable } from './seguimiento-variable';

describe('SeguimientoVariable', () => {
  let component: SeguimientoVariable;
  let fixture: ComponentFixture<SeguimientoVariable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeguimientoVariable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeguimientoVariable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
