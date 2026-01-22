import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmiHome } from './cmi-home';

describe('CmiHome', () => {
  let component: CmiHome;
  let fixture: ComponentFixture<CmiHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmiHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CmiHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
