import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndustrializacionAceite } from './industrializacion-aceite';

describe('IndustrializacionAceite', () => {
  let component: IndustrializacionAceite;
  let fixture: ComponentFixture<IndustrializacionAceite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndustrializacionAceite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndustrializacionAceite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
