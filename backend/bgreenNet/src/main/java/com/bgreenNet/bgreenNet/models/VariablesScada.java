package com.bgreenNet.bgreenNet.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name = "Tabla_12", catalog = "DB_Process_Data_PLCs", schema = "dbo")
public class VariablesScada {
	

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Column(name = "[120TT01]")
    private Float tt120TT01;

    @Column(name = "[150TT02]")
    private Float tt150TT02;

    @Column(name = "[120PT02]")
    private Float pt120PT02;

    @Column(name = "[150TT05]")
    private Float tt150TT05;

    @Column(name = "[120FT02]")
    private Float ft120FT02;

    @Column(name = "[150PT05]")
    private Float pt150PT05;

    @Column(name = "[320PT04]")
    private Float pt320PT04;

    @Column(name = "[320TT02]")
    private Float tt320TT02;

    @Column(name = "[320PT01]")
    private Float pt320PT01;

    @Column(name = "[320TT06]")
    private Float tt320TT06;

    @Column(name = "[320TT08]")
    private Float tt320TT08;

    @Column(name = "[320PT06]")
    private Float pt320PT06;

    @Column(name = "[420TT06]")
    private Float tt420TT06;

    @Column(name = "[420TT05]")
    private Float tt420TT05;

    @Column(name = "[420PT06]")
    private Float pt420PT06;

    @Column(name = "[420PT04]")
    private Float pt420PT04;

    @Column(name = "[420TT01]")
    private Float tt420TT01;

    @Column(name = "[450TT07]")
    private Float tt450TT07;

    @Column(name = "[450PT16]")
    private Float pt450PT16;

    @Column(name = "[350AT01]")
    private Float at350AT01;

    @Column(name = "[550PT03]")
    private Float pt550PT03;

    @Column(name = "[550PT04]")
    private Float pt550PT04;

    @Column(name = "[550TT03]")
    private Float tt550TT03;

    @Column(name = "[550TT06]")
    private Float tt550TT06;

    @Column(name = "[550TT04]")
    private Float tt550TT04;

    @Column(name = "[550TT05]")
    private Float tt550TT05;

    @Column(name = "[550FT04]")
    private Float ft550FT04;

    @Column(name = "[520PT031]")
    private Float pt520PT031;

    @Column(name = "[520TT059]")
    private Float tt520TT059;

    @Column(name = "[520TT012]")
    private Float tt520TT012;

    @Column(name = "[520TT107]")
    private Float tt520TT107;

    @Column(name = "[520TT114]")
    private Float tt520TT114;

    @Column(name = "[421TT02]")
    private Float tt421TT02;

    @Column(name = "[520TT023]")
    private Float tt520TT023;

    @Column(name = "[520PT062]")
    private Float pt520PT062;

    @Column(name = "[520TT04]")
    private Float tt520TT04;

    @Column(name = "[520P05]")
    private Float p520P05;

    @Column(name = "[520FT01]")
    private Float ft520FT01;

    @Column(name = "[520AG01]")
    private Float ag520AG01;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public LocalDateTime getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(LocalDateTime timestamp) {
		this.timestamp = timestamp;
	}

	public Float getTt120TT01() {
		return tt120TT01;
	}

	public void setTt120TT01(Float tt120tt01) {
		tt120TT01 = tt120tt01;
	}

	public Float getTt150TT02() {
		return tt150TT02;
	}

	public void setTt150TT02(Float tt150tt02) {
		tt150TT02 = tt150tt02;
	}

	public Float getPt120PT02() {
		return pt120PT02;
	}

	public void setPt120PT02(Float pt120pt02) {
		pt120PT02 = pt120pt02;
	}

	public Float getTt150TT05() {
		return tt150TT05;
	}

	public void setTt150TT05(Float tt150tt05) {
		tt150TT05 = tt150tt05;
	}

	public Float getFt120FT02() {
		return ft120FT02;
	}

	public void setFt120FT02(Float ft120ft02) {
		ft120FT02 = ft120ft02;
	}

	public Float getPt150PT05() {
		return pt150PT05;
	}

	public void setPt150PT05(Float pt150pt05) {
		pt150PT05 = pt150pt05;
	}

	public Float getPt320PT04() {
		return pt320PT04;
	}

	public void setPt320PT04(Float pt320pt04) {
		pt320PT04 = pt320pt04;
	}

	public Float getTt320TT02() {
		return tt320TT02;
	}

	public void setTt320TT02(Float tt320tt02) {
		tt320TT02 = tt320tt02;
	}

	public Float getPt320PT01() {
		return pt320PT01;
	}

	public void setPt320PT01(Float pt320pt01) {
		pt320PT01 = pt320pt01;
	}

	public Float getTt320TT06() {
		return tt320TT06;
	}

	public void setTt320TT06(Float tt320tt06) {
		tt320TT06 = tt320tt06;
	}

	public Float getTt320TT08() {
		return tt320TT08;
	}

	public void setTt320TT08(Float tt320tt08) {
		tt320TT08 = tt320tt08;
	}

	public Float getPt320PT06() {
		return pt320PT06;
	}

	public void setPt320PT06(Float pt320pt06) {
		pt320PT06 = pt320pt06;
	}

	public Float getTt420TT06() {
		return tt420TT06;
	}

	public void setTt420TT06(Float tt420tt06) {
		tt420TT06 = tt420tt06;
	}

	public Float getTt420TT05() {
		return tt420TT05;
	}

	public void setTt420TT05(Float tt420tt05) {
		tt420TT05 = tt420tt05;
	}

	public Float getPt420PT06() {
		return pt420PT06;
	}

	public void setPt420PT06(Float pt420pt06) {
		pt420PT06 = pt420pt06;
	}

	public Float getPt420PT04() {
		return pt420PT04;
	}

	public void setPt420PT04(Float pt420pt04) {
		pt420PT04 = pt420pt04;
	}

	public Float getTt420TT01() {
		return tt420TT01;
	}

	public void setTt420TT01(Float tt420tt01) {
		tt420TT01 = tt420tt01;
	}

	public Float getTt450TT07() {
		return tt450TT07;
	}

	public void setTt450TT07(Float tt450tt07) {
		tt450TT07 = tt450tt07;
	}

	public Float getPt450PT16() {
		return pt450PT16;
	}

	public void setPt450PT16(Float pt450pt16) {
		pt450PT16 = pt450pt16;
	}

	public Float getAt350AT01() {
		return at350AT01;
	}

	public void setAt350AT01(Float at350at01) {
		at350AT01 = at350at01;
	}

	public Float getPt550PT03() {
		return pt550PT03;
	}

	public void setPt550PT03(Float pt550pt03) {
		pt550PT03 = pt550pt03;
	}

	public Float getPt550PT04() {
		return pt550PT04;
	}

	public void setPt550PT04(Float pt550pt04) {
		pt550PT04 = pt550pt04;
	}

	public Float getTt550TT03() {
		return tt550TT03;
	}

	public void setTt550TT03(Float tt550tt03) {
		tt550TT03 = tt550tt03;
	}

	public Float getTt550TT06() {
		return tt550TT06;
	}

	public void setTt550TT06(Float tt550tt06) {
		tt550TT06 = tt550tt06;
	}

	public Float getTt550TT04() {
		return tt550TT04;
	}

	public void setTt550TT04(Float tt550tt04) {
		tt550TT04 = tt550tt04;
	}

	public Float getTt550TT05() {
		return tt550TT05;
	}

	public void setTt550TT05(Float tt550tt05) {
		tt550TT05 = tt550tt05;
	}

	public Float getFt550FT04() {
		return ft550FT04;
	}

	public void setFt550FT04(Float ft550ft04) {
		ft550FT04 = ft550ft04;
	}

	public Float getPt520PT031() {
		return pt520PT031;
	}

	public void setPt520PT031(Float pt520pt031) {
		pt520PT031 = pt520pt031;
	}

	public Float getTt520TT059() {
		return tt520TT059;
	}

	public void setTt520TT059(Float tt520tt059) {
		tt520TT059 = tt520tt059;
	}

	public Float getTt520TT012() {
		return tt520TT012;
	}

	public void setTt520TT012(Float tt520tt012) {
		tt520TT012 = tt520tt012;
	}

	public Float getTt520TT107() {
		return tt520TT107;
	}

	public void setTt520TT107(Float tt520tt107) {
		tt520TT107 = tt520tt107;
	}

	public Float getTt520TT114() {
		return tt520TT114;
	}

	public void setTt520TT114(Float tt520tt114) {
		tt520TT114 = tt520tt114;
	}

	public Float getTt421TT02() {
		return tt421TT02;
	}

	public void setTt421TT02(Float tt421tt02) {
		tt421TT02 = tt421tt02;
	}

	public Float getTt520TT023() {
		return tt520TT023;
	}

	public void setTt520TT023(Float tt520tt023) {
		tt520TT023 = tt520tt023;
	}

	public Float getPt520PT062() {
		return pt520PT062;
	}

	public void setPt520PT062(Float pt520pt062) {
		pt520PT062 = pt520pt062;
	}

	public Float getTt520TT04() {
		return tt520TT04;
	}

	public void setTt520TT04(Float tt520tt04) {
		tt520TT04 = tt520tt04;
	}

	public Float getP520P05() {
		return p520P05;
	}

	public void setP520P05(Float p520p05) {
		p520P05 = p520p05;
	}

	public Float getFt520FT01() {
		return ft520FT01;
	}

	public void setFt520FT01(Float ft520ft01) {
		ft520FT01 = ft520ft01;
	}

	public Float getAg520AG01() {
		return ag520AG01;
	}

	public void setAg520AG01(Float ag520ag01) {
		ag520AG01 = ag520ag01;
	}
    
    

}
