import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariablesPlc } from './variables-plc';

describe('VariablesPlc', () => {
  let component: VariablesPlc;
  let fixture: ComponentFixture<VariablesPlc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariablesPlc]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VariablesPlc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
