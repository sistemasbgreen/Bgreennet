import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Costodirecto } from './costodirecto';

describe('Costodirecto', () => {
  let component: Costodirecto;
  let fixture: ComponentFixture<Costodirecto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Costodirecto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Costodirecto);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
