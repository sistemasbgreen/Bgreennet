import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetasCMI } from './metas-cmi';

describe('MetasCMI', () => {
  let component: MetasCMI;
  let fixture: ComponentFixture<MetasCMI>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetasCMI]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetasCMI);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
