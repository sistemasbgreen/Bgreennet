import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cpo } from './cpo';

describe('Cpo', () => {
  let component: Cpo;
  let fixture: ComponentFixture<Cpo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cpo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cpo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
