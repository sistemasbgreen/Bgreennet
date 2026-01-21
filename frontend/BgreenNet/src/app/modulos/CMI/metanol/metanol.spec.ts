import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Metanol } from './metanol';

describe('Metanol', () => {
  let component: Metanol;
  let fixture: ComponentFixture<Metanol>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Metanol]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Metanol);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
