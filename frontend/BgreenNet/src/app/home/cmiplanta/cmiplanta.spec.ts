import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cmiplanta } from './cmiplanta';

describe('Cmiplanta', () => {
  let component: Cmiplanta;
  let fixture: ComponentFixture<Cmiplanta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cmiplanta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cmiplanta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
