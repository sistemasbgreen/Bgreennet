import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pulsos } from './pulsos';

describe('Pulsos', () => {
  let component: Pulsos;
  let fixture: ComponentFixture<Pulsos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pulsos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pulsos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
