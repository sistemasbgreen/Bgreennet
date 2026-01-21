import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Metilato } from './metilato';

describe('Metilato', () => {
  let component: Metilato;
  let fixture: ComponentFixture<Metilato>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Metilato]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Metilato);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
