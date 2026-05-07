import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Homeconfig } from './homeconfig';

describe('Homeconfig', () => {
  let component: Homeconfig;
  let fixture: ComponentFixture<Homeconfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Homeconfig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Homeconfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
