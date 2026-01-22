import { ComponentFixture, TestBed } from '@angular/core/testing';

import { B100 } from './b100';

describe('B100', () => {
  let component: B100;
  let fixture: ComponentFixture<B100>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [B100]
    })
    .compileComponents();

    fixture = TestBed.createComponent(B100);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
