package com.bgreenNet.bgreenNet.services;

import com.bgreenNet.bgreenNet.client.NovoSoapClient;
import com.bgreenNet.bgreenNet.models.NovoHistory;
import com.bgreenNet.bgreenNet.models.NovoPoint;
import com.bgreenNet.bgreenNet.models.NovoRule;
import com.bgreenNet.bgreenNet.repository.NovoHistoryRepository;
import com.bgreenNet.bgreenNet.repository.NovoPointRepository;
import com.bgreenNet.bgreenNet.repository.NovoRuleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class NovoIntegrationServiceTest {

    private NovoIntegrationService integrationService;

    @Mock
    private NovoSoapClient soapClient;

    @Mock
    private NovoRuleRepository ruleRepository;

    @Mock
    private NovoHistoryRepository historyRepository;

    @Mock
    private NovoPointRepository pointRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        integrationService = new NovoIntegrationService(
                soapClient,
                ruleRepository,
                historyRepository,
                pointRepository,
                objectMapper
        );
    }

    @Test
    void testFetchAndSaveUserRules_Success() {
        String jsonResult = "{\"Result\":0,\"Message\":\"Success\",\"Data\":[{\"RuleId\":34,\"RuleDescription\":\"Diario\",\"RuleType\":\"History\",\"RuleFilter\":\"Daily\"}]}";
        when(soapClient.loadUserRulesJson()).thenReturn(jsonResult);
        when(ruleRepository.save(any(NovoRule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<NovoRule> rules = integrationService.fetchAndSaveUserRules();

        assertNotNull(rules);
        assertEquals(1, rules.size());
        assertEquals(34L, rules.get(0).getRuleId());
        assertEquals("Diario", rules.get(0).getRuleDescription());
        verify(ruleRepository, times(1)).save(any(NovoRule.class));
    }

    @Test
    void testFetchAndSaveUserRules_ErrorResult() {
        String jsonResult = "{\"Result\":-1,\"Message\":\"Unauthorized access\",\"Data\":[]}";
        when(soapClient.loadUserRulesJson()).thenReturn(jsonResult);

        Exception exception = assertThrows(RuntimeException.class, () -> {
            integrationService.fetchAndSaveUserRules();
        });

        assertTrue(exception.getMessage().contains("Unauthorized access"));
        verify(ruleRepository, never()).save(any());
    }

    @Test
    void testFetchAndSaveRuleHistory_Success() {
        String jsonResult = "{\"Result\":0,\"Message\":\"Success\",\"Data\":[{\"DeviceId\":10,\"DeviceName\":\"Sensor 1\",\"MeterId\":\"M123\",\"History\":\"HistoryData\",\"HistoryId\":1,\"HistoryName\":\"Daily History\",\"IntervalType\":\"Daily\",\"DetailHistory\":{\"temp\":25.4},\"HistoryDateTime\":\"08-24-2026 12:00:00\",\"RunType\":\"Normal\"}]}";
        when(soapClient.loadRuleHistoryDataJson(anyLong(), anyString(), anyString())).thenReturn(jsonResult);
        when(historyRepository.save(any(NovoHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LocalDateTime start = LocalDateTime.of(2026, 8, 24, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 8, 24, 23, 59);
        List<NovoHistory> histories = integrationService.fetchAndSaveRuleHistory(34L, start, end);

        assertNotNull(histories);
        assertEquals(1, histories.size());
        assertEquals(10L, histories.get(0).getDeviceId());
        assertEquals("M123", histories.get(0).getMeterId());
        assertEquals("{\"temp\":25.4}", histories.get(0).getDetailHistoryJson());
        assertEquals(LocalDateTime.of(2026, 8, 24, 12, 0), histories.get(0).getHistoryDateTime());
        verify(historyRepository, times(1)).save(any(NovoHistory.class));
    }

    @Test
    void testFetchAndSavePointRuleData_Success() {
        String jsonResult = "{\"Result\":0,\"Message\":\"Success\",\"Data\":[{\"DeviceId\":12,\"DeviceName\":\"Sensor 2\",\"MeterId\":\"M456\",\"ProtocolComm\":\"Modbus\",\"Attributes\":[{\"Attribute\":\"Temperature\",\"PointAddress\":\"40001\",\"PointName\":\"Temp Sensor\",\"PointUnit\":\"C\",\"CurrentValue\":\"26.5\",\"ModificationDateTime\":\"08-24-2026 14:30:00\"}]}]}";
        when(soapClient.loadPointRuleDataJson(anyLong())).thenReturn(jsonResult);
        when(pointRepository.save(any(NovoPoint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<NovoPoint> points = integrationService.fetchAndSavePointRuleData(36L);

        assertNotNull(points);
        assertEquals(1, points.size());
        assertEquals(12L, points.get(0).getDeviceId());
        assertEquals("Temperature", points.get(0).getAttributeName());
        assertEquals("26.5", points.get(0).getCurrentValue());
        assertEquals(LocalDateTime.of(2026, 8, 24, 14, 30), points.get(0).getModificationDateTime());
        verify(pointRepository, times(1)).save(any(NovoPoint.class));
    }
}
