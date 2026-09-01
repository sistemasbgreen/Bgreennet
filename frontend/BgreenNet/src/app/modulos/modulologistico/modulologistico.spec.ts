import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modulologistico } from './modulologistico';

describe('Modulologistico', () => {
  let component: Modulologistico;
  let fixture: ComponentFixture<Modulologistico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modulologistico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Modulologistico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
