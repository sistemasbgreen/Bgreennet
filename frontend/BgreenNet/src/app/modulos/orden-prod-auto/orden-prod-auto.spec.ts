import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdenProdAuto } from './orden-prod-auto';

describe('OrdenProdAuto', () => {
  let component: OrdenProdAuto;
  let fixture: ComponentFixture<OrdenProdAuto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdenProdAuto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdenProdAuto);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
