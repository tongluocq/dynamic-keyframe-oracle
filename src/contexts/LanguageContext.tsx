import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ja' | 'zh' | 'es' | 'alien';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'app.title': 'IMSCHM - Industrial Monitoring System',
    'app.subtitle': 'Causal Health Monitoring with Neural Networks',
    'language.select': 'Language',
    
    // Status
    'status.running': 'Running',
    'status.stopped': 'Stopped',
    'status.healthy': 'Healthy',
    'status.warning': 'Warning',
    'status.critical': 'Critical',
    
    // Controls
    'control.start': 'Start',
    'control.stop': 'Stop',
    'control.reset': 'Reset',
    'control.run_examples': 'Run 2 Examples',
    'control.run_verification': 'Run Verification Suite',
    
    // Tabs
    'tab.monitor': 'Monitor',
    'tab.causal': 'Causal',
    'tab.intervention': 'do()',
    'tab.whatif': 'What-If',
    'tab.prescriptive': 'Prescriptive',
    'tab.verification': 'Verify',
    'tab.examples': 'Examples',
    
    // Metrics
    'metric.thrust': 'Thrust',
    'metric.temperature': 'Temperature',
    'metric.vibration': 'Vibration',
    'metric.pressure': 'Pressure',
    'metric.rpm': 'RPM',
    'metric.efficiency': 'Efficiency',
    
    // Causal Panel
    'causal.title': 'Causal Analysis',
    'causal.ate': 'Average Treatment Effect',
    'causal.cate': 'Conditional Average Treatment Effect',
    'causal.discovery': 'Causal Discovery',
    'causal.graph': 'Causal Graph',
    
    // Intervention Panel
    'intervention.title': 'Causal Intervention (do-calculus)',
    'intervention.select': 'Select Intervention',
    'intervention.execute': 'Execute Intervention',
    'intervention.results': 'Intervention Results',
    'intervention.primary_effect': 'Primary Effect',
    'intervention.secondary_effects': 'Secondary Effects',
    'intervention.risk': 'Risk Assessment',
    
    // Counterfactual Panel
    'counterfactual.title': 'Counterfactual Analysis',
    'counterfactual.query': 'What-If Query',
    'counterfactual.result': 'Counterfactual Result',
    'counterfactual.confidence': 'Confidence',
    
    // Prescriptive Panel
    'prescriptive.title': 'Prescriptive AI Recommendations',
    'prescriptive.action': 'Recommended Action',
    'prescriptive.priority': 'Priority',
    'prescriptive.impact': 'Expected Impact',
    
    // Verification Panel
    'verification.title': 'Dataset Verification',
    'verification.tests': 'Tests',
    'verification.physics': 'Physics',
    'verification.evidence': 'Evidence',
    'verification.passed': 'Passed',
    'verification.failed': 'Failed',
    
    // Function Status
    'function.status': 'Function Completion Status',
    'function.complete': 'Complete',
    'function.partial': 'Partial',
    'function.pending': 'Pending',
    
    // Examples Panel
    'examplesPanel': 'Causal Analysis Examples',
    'examplesDescription': 'Concrete examples with actual float values for TBM device monitoring',
    'causalEffects': 'CVGG Effects',
    'counterfactual': 'Counterfactual',
    'prescriptiveAI': 'Prescriptive AI',
    'decisionVsPrescriptive': 'Decision vs Prescriptive',
    'causalEffectDescription': 'Average and Conditional Treatment Effects from CVGG inference',
    'counterfactualDescription': 'What-If analysis with hypothetical interventions',
    'prescriptiveDescription': 'AI-generated recommendations based on causal analysis',
    'floatValues': 'Float Values',
    'normalOperation': 'Normal',
    'faultCondition': 'Fault',
    'confidence': 'Confidence',
    'directEffect': 'Direct Effect',
    'indirectEffect': 'Indirect Effect',
    'metric': 'Metric',
    'value': 'Value',
    'baselineOutcome': 'Baseline Outcome',
    'counterfactualOutcome': 'Counterfactual Outcome',
    'causalEffect': 'Causal Effect',
    'riskIncreased': 'Risk Increased',
    'riskDecreased': 'Risk Decreased',
    'riskUnchanged': 'Risk Unchanged',
    'recommendation': 'Recommendation',
    'riskReduction': 'Risk Reduction',
    'costSaving': 'Cost Saving',
    'downtimeAvoided': 'Downtime Avoided',
    'prescriptiveVsDecision': 'Prescriptive AI vs Decision Making',
    'decisionMaking': 'Decision Making',
    'prescriptiveFeature1': 'Generates multiple recommendations',
    'prescriptiveFeature2': 'Ranks by causal impact (ATE/CATE)',
    'prescriptiveFeature3': 'Outputs: action + priority + confidence',
    'decisionFeature1': 'Selects single optimal action',
    'decisionFeature2': 'Considers constraints (budget, time)',
    'decisionFeature3': 'Outputs: execution plan + cost + timeline',
    'prescriptiveInputs': 'Prescriptive AI Inputs',
    'decisionOutput': 'Decision Output',
    'action': 'Action',
    'score': 'Score',
    'executionCost': 'Execution Cost',
    'budget': 'Budget',
    'timeline': 'Timeline',
    'floatValueReference': 'Float Value Reference',
    'floatValueReferenceDesc': 'Summary of all metrics and their meanings',
    'symbol': 'Symbol',
    'range': 'Range',
    'interpretation': 'Interpretation',
    
    // General
    'general.loading': 'Loading...',
    'general.error': 'Error',
    'general.success': 'Success',
    'general.cancel': 'Cancel',
    'general.confirm': 'Confirm',
    'general.save': 'Save',
    'general.close': 'Close',
  },
  
  ja: {
    // Header
    'app.title': 'IMSCHM - 産業監視システム',
    'app.subtitle': 'ニューラルネットワークによる因果健康監視',
    'language.select': '言語',
    
    // Status
    'status.running': '実行中',
    'status.stopped': '停止',
    'status.healthy': '正常',
    'status.warning': '警告',
    'status.critical': '危険',
    
    // Controls
    'control.start': '開始',
    'control.stop': '停止',
    'control.reset': 'リセット',
    'control.run_examples': '2例を実行',
    'control.run_verification': '検証スイートを実行',
    
    // Tabs
    'tab.monitor': 'モニター',
    'tab.causal': '因果',
    'tab.intervention': 'do()',
    'tab.whatif': '仮説',
    'tab.prescriptive': '処方',
    'tab.verification': '検証',
    'tab.examples': '例',
    
    // Metrics
    'metric.thrust': '推力',
    'metric.temperature': '温度',
    'metric.vibration': '振動',
    'metric.pressure': '圧力',
    'metric.rpm': '回転数',
    'metric.efficiency': '効率',
    
    // Causal Panel
    'causal.title': '因果分析',
    'causal.ate': '平均処置効果',
    'causal.cate': '条件付き平均処置効果',
    'causal.discovery': '因果発見',
    'causal.graph': '因果グラフ',
    
    // Intervention Panel
    'intervention.title': '因果介入 (do計算)',
    'intervention.select': '介入を選択',
    'intervention.execute': '介入を実行',
    'intervention.results': '介入結果',
    'intervention.primary_effect': '主効果',
    'intervention.secondary_effects': '副次効果',
    'intervention.risk': 'リスク評価',
    
    // Counterfactual Panel
    'counterfactual.title': '反事実分析',
    'counterfactual.query': '仮説クエリ',
    'counterfactual.result': '反事実結果',
    'counterfactual.confidence': '信頼度',
    
    // Prescriptive Panel
    'prescriptive.title': '処方AIの推奨',
    'prescriptive.action': '推奨アクション',
    'prescriptive.priority': '優先度',
    'prescriptive.impact': '予想される影響',
    
    // Verification Panel
    'verification.title': 'データセット検証',
    'verification.tests': 'テスト',
    'verification.physics': '物理',
    'verification.evidence': '証拠',
    'verification.passed': '合格',
    'verification.failed': '不合格',
    
    // Function Status
    'function.status': '機能完了状態',
    'function.complete': '完了',
    'function.partial': '部分的',
    'function.pending': '保留',
    
    // Examples Panel
    'examplesPanel': '因果分析の例',
    'examplesDescription': 'TBMデバイス監視のための実際の浮動小数点値を含む具体例',
    'causalEffects': 'CVGG効果',
    'counterfactual': '反事実',
    'prescriptiveAI': '処方AI',
    'decisionVsPrescriptive': '意思決定 vs 処方',
    'causalEffectDescription': 'CVGG推論からの平均および条件付き処置効果',
    'counterfactualDescription': '仮説的介入によるWhat-If分析',
    'prescriptiveDescription': '因果分析に基づくAI生成推奨',
    'floatValues': '浮動小数点値',
    'normalOperation': '正常',
    'faultCondition': '異常',
    'confidence': '信頼度',
    'directEffect': '直接効果',
    'indirectEffect': '間接効果',
    'metric': '指標',
    'value': '値',
    'baselineOutcome': 'ベースライン結果',
    'counterfactualOutcome': '反事実結果',
    'causalEffect': '因果効果',
    'riskIncreased': 'リスク増加',
    'riskDecreased': 'リスク減少',
    'riskUnchanged': 'リスク不変',
    'recommendation': '推奨',
    'riskReduction': 'リスク削減',
    'costSaving': 'コスト削減',
    'downtimeAvoided': 'ダウンタイム回避',
    'prescriptiveVsDecision': '処方AI vs 意思決定',
    'decisionMaking': '意思決定',
    'prescriptiveFeature1': '複数の推奨を生成',
    'prescriptiveFeature2': '因果効果でランク付け (ATE/CATE)',
    'prescriptiveFeature3': '出力: アクション + 優先度 + 信頼度',
    'decisionFeature1': '単一の最適アクションを選択',
    'decisionFeature2': '制約を考慮 (予算、時間)',
    'decisionFeature3': '出力: 実行計画 + コスト + タイムライン',
    'prescriptiveInputs': '処方AI入力',
    'decisionOutput': '意思決定出力',
    'action': 'アクション',
    'score': 'スコア',
    'executionCost': '実行コスト',
    'budget': '予算',
    'timeline': 'タイムライン',
    'floatValueReference': '浮動小数点値リファレンス',
    'floatValueReferenceDesc': '全ての指標とその意味のサマリー',
    'symbol': '記号',
    'range': '範囲',
    'interpretation': '解釈',
    
    // General
    'general.loading': '読み込み中...',
    'general.error': 'エラー',
    'general.success': '成功',
    'general.cancel': 'キャンセル',
    'general.confirm': '確認',
    'general.save': '保存',
    'general.close': '閉じる',
  },
  
  zh: {
    // Header
    'app.title': 'IMSCHM - 工业监控系统',
    'app.subtitle': '神经网络因果健康监测',
    'language.select': '语言',
    
    // Status
    'status.running': '运行中',
    'status.stopped': '已停止',
    'status.healthy': '健康',
    'status.warning': '警告',
    'status.critical': '危险',
    
    // Controls
    'control.start': '启动',
    'control.stop': '停止',
    'control.reset': '重置',
    'control.run_examples': '运行2个示例',
    'control.run_verification': '运行验证套件',
    
    // Tabs
    'tab.monitor': '监控',
    'tab.causal': '因果',
    'tab.intervention': 'do()',
    'tab.whatif': '假设',
    'tab.prescriptive': '处方',
    'tab.verification': '验证',
    'tab.examples': '示例',
    
    // Metrics
    'metric.thrust': '推力',
    'metric.temperature': '温度',
    'metric.vibration': '振动',
    'metric.pressure': '压力',
    'metric.rpm': '转速',
    'metric.efficiency': '效率',
    
    // Causal Panel
    'causal.title': '因果分析',
    'causal.ate': '平均处理效应',
    'causal.cate': '条件平均处理效应',
    'causal.discovery': '因果发现',
    'causal.graph': '因果图',
    
    // Intervention Panel
    'intervention.title': '因果干预 (do演算)',
    'intervention.select': '选择干预',
    'intervention.execute': '执行干预',
    'intervention.results': '干预结果',
    'intervention.primary_effect': '主要效应',
    'intervention.secondary_effects': '次要效应',
    'intervention.risk': '风险评估',
    
    // Counterfactual Panel
    'counterfactual.title': '反事实分析',
    'counterfactual.query': '假设查询',
    'counterfactual.result': '反事实结果',
    'counterfactual.confidence': '置信度',
    
    // Prescriptive Panel
    'prescriptive.title': '处方AI建议',
    'prescriptive.action': '建议操作',
    'prescriptive.priority': '优先级',
    'prescriptive.impact': '预期影响',
    
    // Verification Panel
    'verification.title': '数据集验证',
    'verification.tests': '测试',
    'verification.physics': '物理',
    'verification.evidence': '证据',
    'verification.passed': '通过',
    'verification.failed': '失败',
    
    // Function Status
    'function.status': '功能完成状态',
    'function.complete': '完成',
    'function.partial': '部分',
    'function.pending': '待定',
    
    // Examples Panel
    'examplesPanel': '因果分析示例',
    'examplesDescription': '用于TBM设备监控的实际浮点值具体示例',
    'causalEffects': 'CVGG效应',
    'counterfactual': '反事实',
    'prescriptiveAI': '处方AI',
    'decisionVsPrescriptive': '决策 vs 处方',
    'causalEffectDescription': 'CVGG推理的平均和条件处理效应',
    'counterfactualDescription': '假设干预的What-If分析',
    'prescriptiveDescription': '基于因果分析的AI生成建议',
    'floatValues': '浮点值',
    'normalOperation': '正常',
    'faultCondition': '故障',
    'confidence': '置信度',
    'directEffect': '直接效应',
    'indirectEffect': '间接效应',
    'metric': '指标',
    'value': '值',
    'baselineOutcome': '基线结果',
    'counterfactualOutcome': '反事实结果',
    'causalEffect': '因果效应',
    'riskIncreased': '风险增加',
    'riskDecreased': '风险降低',
    'riskUnchanged': '风险不变',
    'recommendation': '建议',
    'riskReduction': '风险降低',
    'costSaving': '成本节省',
    'downtimeAvoided': '避免停机',
    'prescriptiveVsDecision': '处方AI vs 决策',
    'decisionMaking': '决策制定',
    'prescriptiveFeature1': '生成多个建议',
    'prescriptiveFeature2': '按因果影响排名 (ATE/CATE)',
    'prescriptiveFeature3': '输出: 行动 + 优先级 + 置信度',
    'decisionFeature1': '选择单一最优行动',
    'decisionFeature2': '考虑约束 (预算、时间)',
    'decisionFeature3': '输出: 执行计划 + 成本 + 时间线',
    'prescriptiveInputs': '处方AI输入',
    'decisionOutput': '决策输出',
    'action': '行动',
    'score': '评分',
    'executionCost': '执行成本',
    'budget': '预算',
    'timeline': '时间线',
    'floatValueReference': '浮点值参考',
    'floatValueReferenceDesc': '所有指标及其含义的摘要',
    'symbol': '符号',
    'range': '范围',
    'interpretation': '解释',
    
    // General
    'general.loading': '加载中...',
    'general.error': '错误',
    'general.success': '成功',
    'general.cancel': '取消',
    'general.confirm': '确认',
    'general.save': '保存',
    'general.close': '关闭',
  },
  
  es: {
    // Header
    'app.title': 'IMSCHM - Sistema de Monitoreo Industrial',
    'app.subtitle': 'Monitoreo Causal de Salud con Redes Neuronales',
    'language.select': 'Idioma',
    
    // Status
    'status.running': 'Ejecutando',
    'status.stopped': 'Detenido',
    'status.healthy': 'Saludable',
    'status.warning': 'Advertencia',
    'status.critical': 'Crítico',
    
    // Controls
    'control.start': 'Iniciar',
    'control.stop': 'Detener',
    'control.reset': 'Reiniciar',
    'control.run_examples': 'Ejecutar 2 Ejemplos',
    'control.run_verification': 'Ejecutar Suite de Verificación',
    
    // Tabs
    'tab.monitor': 'Monitor',
    'tab.causal': 'Causal',
    'tab.intervention': 'do()',
    'tab.whatif': 'Hipótesis',
    'tab.prescriptive': 'Prescriptivo',
    'tab.verification': 'Verificar',
    'tab.examples': 'Ejemplos',
    
    // Metrics
    'metric.thrust': 'Empuje',
    'metric.temperature': 'Temperatura',
    'metric.vibration': 'Vibración',
    'metric.pressure': 'Presión',
    'metric.rpm': 'RPM',
    'metric.efficiency': 'Eficiencia',
    
    // Causal Panel
    'causal.title': 'Análisis Causal',
    'causal.ate': 'Efecto Promedio del Tratamiento',
    'causal.cate': 'Efecto Promedio Condicional',
    'causal.discovery': 'Descubrimiento Causal',
    'causal.graph': 'Grafo Causal',
    
    // Intervention Panel
    'intervention.title': 'Intervención Causal (do-cálculo)',
    'intervention.select': 'Seleccionar Intervención',
    'intervention.execute': 'Ejecutar Intervención',
    'intervention.results': 'Resultados de Intervención',
    'intervention.primary_effect': 'Efecto Primario',
    'intervention.secondary_effects': 'Efectos Secundarios',
    'intervention.risk': 'Evaluación de Riesgo',
    
    // Counterfactual Panel
    'counterfactual.title': 'Análisis Contrafactual',
    'counterfactual.query': 'Consulta Hipotética',
    'counterfactual.result': 'Resultado Contrafactual',
    'counterfactual.confidence': 'Confianza',
    
    // Prescriptive Panel
    'prescriptive.title': 'Recomendaciones de IA Prescriptiva',
    'prescriptive.action': 'Acción Recomendada',
    'prescriptive.priority': 'Prioridad',
    'prescriptive.impact': 'Impacto Esperado',
    
    // Verification Panel
    'verification.title': 'Verificación del Conjunto de Datos',
    'verification.tests': 'Pruebas',
    'verification.physics': 'Física',
    'verification.evidence': 'Evidencia',
    'verification.passed': 'Aprobado',
    'verification.failed': 'Fallido',
    
    // Function Status
    'function.status': 'Estado de Completación de Funciones',
    'function.complete': 'Completo',
    'function.partial': 'Parcial',
    'function.pending': 'Pendiente',
    
    // Examples Panel
    'examplesPanel': 'Ejemplos de Análisis Causal',
    'examplesDescription': 'Ejemplos concretos con valores flotantes reales para monitoreo de dispositivos TBM',
    'causalEffects': 'Efectos CVGG',
    'counterfactual': 'Contrafactual',
    'prescriptiveAI': 'IA Prescriptiva',
    'decisionVsPrescriptive': 'Decisión vs Prescriptivo',
    'causalEffectDescription': 'Efectos de tratamiento promedio y condicional de inferencia CVGG',
    'counterfactualDescription': 'Análisis What-If con intervenciones hipotéticas',
    'prescriptiveDescription': 'Recomendaciones generadas por IA basadas en análisis causal',
    'floatValues': 'Valores Flotantes',
    'normalOperation': 'Normal',
    'faultCondition': 'Fallo',
    'confidence': 'Confianza',
    'directEffect': 'Efecto Directo',
    'indirectEffect': 'Efecto Indirecto',
    'metric': 'Métrica',
    'value': 'Valor',
    'baselineOutcome': 'Resultado Base',
    'counterfactualOutcome': 'Resultado Contrafactual',
    'causalEffect': 'Efecto Causal',
    'riskIncreased': 'Riesgo Aumentado',
    'riskDecreased': 'Riesgo Disminuido',
    'riskUnchanged': 'Riesgo Sin Cambios',
    'recommendation': 'Recomendación',
    'riskReduction': 'Reducción de Riesgo',
    'costSaving': 'Ahorro de Costos',
    'downtimeAvoided': 'Tiempo Inactivo Evitado',
    'prescriptiveVsDecision': 'IA Prescriptiva vs Toma de Decisiones',
    'decisionMaking': 'Toma de Decisiones',
    'prescriptiveFeature1': 'Genera múltiples recomendaciones',
    'prescriptiveFeature2': 'Clasifica por impacto causal (ATE/CATE)',
    'prescriptiveFeature3': 'Salidas: acción + prioridad + confianza',
    'decisionFeature1': 'Selecciona una acción óptima',
    'decisionFeature2': 'Considera restricciones (presupuesto, tiempo)',
    'decisionFeature3': 'Salidas: plan de ejecución + costo + cronograma',
    'prescriptiveInputs': 'Entradas de IA Prescriptiva',
    'decisionOutput': 'Salida de Decisión',
    'action': 'Acción',
    'score': 'Puntuación',
    'executionCost': 'Costo de Ejecución',
    'budget': 'Presupuesto',
    'timeline': 'Cronograma',
    'floatValueReference': 'Referencia de Valores Flotantes',
    'floatValueReferenceDesc': 'Resumen de todas las métricas y sus significados',
    'symbol': 'Símbolo',
    'range': 'Rango',
    'interpretation': 'Interpretación',
    
    // General
    'general.loading': 'Cargando...',
    'general.error': 'Error',
    'general.success': 'Éxito',
    'general.cancel': 'Cancelar',
    'general.confirm': 'Confirmar',
    'general.save': 'Guardar',
    'general.close': 'Cerrar',
  },
  
  alien: {
    // Header
    'app.title': 'IMSCHM - ⌇⍜⌰⍀⟟⏃ ⋔⍜⋏⟟⏁⍜⍀',
    'app.subtitle': '⋏⟒⎍⍀⏃⌰ ☊⏃⎍⌇⏃⌰ ⊑⟒⏃⌰⏁⊑ ⌇⊬⌇⏁⟒⋔',
    'language.select': '⌰⏃⋏☌',
    
    // Status
    'status.running': '⍀⎍⋏⋏⟟⋏☌',
    'status.stopped': '⌇⏁⍜⌿⌿⟒⎅',
    'status.healthy': '⊑⟒⏃⌰⏁⊑⊬',
    'status.warning': '⍙⏃⍀⋏⟟⋏☌',
    'status.critical': '☊⍀⟟⏁⟟☊⏃⌰',
    
    // Controls
    'control.start': '⌇⏁⏃⍀⏁',
    'control.stop': '⌇⏁⍜⌿',
    'control.reset': '⍀⟒⌇⟒⏁',
    'control.run_examples': '⍀⎍⋏ ⟒⌖⏃⋔⌿⌰⟒⌇',
    'control.run_verification': '⎐⟒⍀⟟⎎⊬ ⌇⎍⟟⏁⟒',
    
    // Tabs
    'tab.monitor': '⋔⍜⋏⟟⏁⍜⍀',
    'tab.causal': '☊⏃⎍⌇⏃⌰',
    'tab.intervention': '⎅⍜()',
    'tab.whatif': '⍙⊑⏃⏁-⟟⎎',
    'tab.prescriptive': '⌿⍀⟒⌇☊⍀⟟⌿⏁',
    'tab.verification': '⎐⟒⍀⟟⎎⊬',
    'tab.examples': '⟒⌖⏃⋔⌿⌰⟒⌇',
    
    // Metrics
    'metric.thrust': '⏁⊑⍀⎍⌇⏁',
    'metric.temperature': '⏁⟒⋔⌿',
    'metric.vibration': '⎐⟟⏚⟒',
    'metric.pressure': '⌿⍀⟒⌇⌇',
    'metric.rpm': '⍀⌿⋔',
    'metric.efficiency': '⟒⎎⎎⟟☊',
    
    // Causal Panel
    'causal.title': '☊⏃⎍⌇⏃⌰ ⏃⋏⏃⌰⊬⌇⟟⌇',
    'causal.ate': '⏃⎐⟒⍀⏃☌⟒ ⏁⍀⟒⏃⏁⋔⟒⋏⏁',
    'causal.cate': '☊⍜⋏⎅⟟⏁⟟⍜⋏⏃⌰ ⟒⎎⎎⟒☊⏁',
    'causal.discovery': '⎅⟟⌇☊⍜⎐⟒⍀⊬',
    'causal.graph': '☊⏃⎍⌇⏃⌰ ☌⍀⏃⌿⊑',
    
    // Intervention Panel
    'intervention.title': '☊⏃⎍⌇⏃⌰ ⟟⋏⏁⟒⍀⎐⟒⋏⏁⟟⍜⋏',
    'intervention.select': '⌇⟒⌰⟒☊⏁ ⟟⋏⏁⟒⍀⎐⟒⋏⏁⟟⍜⋏',
    'intervention.execute': '⟒⌖⟒☊⎍⏁⟒',
    'intervention.results': '⍀⟒⌇⎍⌰⏁⌇',
    'intervention.primary_effect': '⌿⍀⟟⋔⏃⍀⊬ ⟒⎎⎎⟒☊⏁',
    'intervention.secondary_effects': '⌇⟒☊⍜⋏⎅⏃⍀⊬',
    'intervention.risk': '⍀⟟⌇☍ ⏃⌇⌇⟒⌇⌇',
    
    // Counterfactual Panel
    'counterfactual.title': '☊⍜⎍⋏⏁⟒⍀⎎⏃☊⏁⎍⏃⌰',
    'counterfactual.query': '⍙⊑⏃⏁-⟟⎎ ⍾⎍⟒⍀⊬',
    'counterfactual.result': '⍀⟒⌇⎍⌰⏁',
    'counterfactual.confidence': '☊⍜⋏⎎⟟⎅⟒⋏☊⟒',
    
    // Prescriptive Panel
    'prescriptive.title': '⌿⍀⟒⌇☊⍀⟟⌿⏁⟟⎐⟒ ⏃⟟',
    'prescriptive.action': '⍀⟒☊⍜⋔⋔⟒⋏⎅⟒⎅ ⏃☊⏁⟟⍜⋏',
    'prescriptive.priority': '⌿⍀⟟⍜⍀⟟⏁⊬',
    'prescriptive.impact': '⟒⌖⌿⟒☊⏁⟒⎅ ⟟⋔⌿⏃☊⏁',
    
    // Verification Panel
    'verification.title': '⎅⏃⏁⏃⌇⟒⏁ ⎐⟒⍀⟟⎎⟟☊⏃⏁⟟⍜⋏',
    'verification.tests': '⏁⟒⌇⏁⌇',
    'verification.physics': '⌿⊑⊬⌇⟟☊⌇',
    'verification.evidence': '⟒⎐⟟⎅⟒⋏☊⟒',
    'verification.passed': '⌿⏃⌇⌇⟒⎅',
    'verification.failed': '⎎⏃⟟⌰⟒⎅',
    
    // Function Status
    'function.status': '⎎⎍⋏☊⏁⟟⍜⋏ ⌇⏁⏃⏁⎍⌇',
    'function.complete': '☊⍜⋔⌿⌰⟒⏁⟒',
    'function.partial': '⌿⏃⍀⏁⟟⏃⌰',
    'function.pending': '⌿⟒⋏⎅⟟⋏☌',
    
    // Examples Panel
    'examplesPanel': '☊⏃⎍⌇⏃⌰ ⟒⌖⏃⋔⌿⌰⟒⌇',
    'examplesDescription': '⏁⏚⋔ ⎅⟒⎐⟟☊⟒ ⋔⍜⋏⟟⏁⍜⍀⟟⋏☌',
    'causalEffects': '☊⎐☌☌ ⟒⎎⎎⟒☊⏁⌇',
    'counterfactual': '☊⍜⎍⋏⏁⟒⍀⎎⏃☊⏁',
    'prescriptiveAI': '⌿⍀⟒⌇☊⍀⟟⌿⏁⟟⎐⟒ ⏃⟟',
    'decisionVsPrescriptive': '⎅⟒☊⟟⌇⟟⍜⋏ ⎐⌇ ⌿⍀⟒⌇☊',
    'causalEffectDescription': '⏃⏁⟒/☊⏃⏁⟒ ⎎⍀⍜⋔ ☊⎐☌☌',
    'counterfactualDescription': '⍙⊑⏃⏁-⟟⎎ ⏃⋏⏃⌰⊬⌇⟟⌇',
    'prescriptiveDescription': '⏃⟟ ⍀⟒☊⍜⋔⋔⟒⋏⎅⏃⏁⟟⍜⋏⌇',
    'floatValues': '⎎⌰⍜⏃⏁ ⎐⏃⌰⎍⟒⌇',
    'normalOperation': '⋏⍜⍀⋔⏃⌰',
    'faultCondition': '⎎⏃⎍⌰⏁',
    'confidence': '☊⍜⋏⎎⟟⎅⟒⋏☊⟒',
    'directEffect': '⎅⟟⍀⟒☊⏁ ⟒⎎⎎⟒☊⏁',
    'indirectEffect': '⟟⋏⎅⟟⍀⟒☊⏁ ⟒⎎⎎⟒☊⏁',
    'metric': '⋔⟒⏁⍀⟟☊',
    'value': '⎐⏃⌰⎍⟒',
    'baselineOutcome': '⏚⏃⌇⟒⌰⟟⋏⟒',
    'counterfactualOutcome': '☊⍜⎍⋏⏁⟒⍀⎎⏃☊⏁⎍⏃⌰',
    'causalEffect': '☊⏃⎍⌇⏃⌰ ⟒⎎⎎⟒☊⏁',
    'riskIncreased': '⍀⟟⌇☍ ⟟⋏☊⍀⟒⏃⌇⟒⎅',
    'riskDecreased': '⍀⟟⌇☍ ⎅⟒☊⍀⟒⏃⌇⟒⎅',
    'riskUnchanged': '⍀⟟⌇☍ ⎍⋏☊⊑⏃⋏☌⟒⎅',
    'recommendation': '⍀⟒☊⍜⋔⋔⟒⋏⎅',
    'riskReduction': '⍀⟟⌇☍ ⍀⟒⎅⎍☊⏁⟟⍜⋏',
    'costSaving': '☊⍜⌇⏁ ⌇⏃⎐⟟⋏☌',
    'downtimeAvoided': '⎅⍜⍙⋏⏁⟟⋔⟒ ⏃⎐⍜⟟⎅⟒⎅',
    'prescriptiveVsDecision': '⌿⍀⟒⌇☊⍀⟟⌿⏁⟟⎐⟒ ⎐⌇ ⎅⟒☊⟟⌇⟟⍜⋏',
    'decisionMaking': '⎅⟒☊⟟⌇⟟⍜⋏ ⋔⏃☍⟟⋏☌',
    'prescriptiveFeature1': '⋔⎍⌰⏁⟟⌿⌰⟒ ⍀⟒☊⌇',
    'prescriptiveFeature2': '⍀⏃⋏☍ ⏚⊬ ⏃⏁⟒/☊⏃⏁⟒',
    'prescriptiveFeature3': '⏃☊⏁⟟⍜⋏ + ⌿⍀⟟⍜⍀⟟⏁⊬',
    'decisionFeature1': '⌇⟒⌰⟒☊⏁ ⍜⌿⏁⟟⋔⏃⌰',
    'decisionFeature2': '☊⍜⋏⌇⏁⍀⏃⟟⋏⏁⌇',
    'decisionFeature3': '⌿⌰⏃⋏ + ☊⍜⌇⏁ + ⏁⟟⋔⟒',
    'prescriptiveInputs': '⌿⍀⟒⌇☊ ⟟⋏⌿⎍⏁⌇',
    'decisionOutput': '⎅⟒☊⟟⌇⟟⍜⋏ ⍜⎍⏁⌿⎍⏁',
    'action': '⏃☊⏁⟟⍜⋏',
    'score': '⌇☊⍜⍀⟒',
    'executionCost': '⟒⌖⟒☊ ☊⍜⌇⏁',
    'budget': '⏚⎍⎅☌⟒⏁',
    'timeline': '⏁⟟⋔⟒⌰⟟⋏⟒',
    'floatValueReference': '⎎⌰⍜⏃⏁ ⍀⟒⎎⟒⍀⟒⋏☊⟒',
    'floatValueReferenceDesc': '⋔⟒⏁⍀⟟☊⌇ ⌇⎍⋔⋔⏃⍀⊬',
    'symbol': '⌇⊬⋔⏚⍜⌰',
    'range': '⍀⏃⋏☌⟒',
    'interpretation': '⟟⋏⏁⟒⍀⌿⍀⟒⏁',
    
    // General
    'general.loading': '⌰⍜⏃⎅⟟⋏☌...',
    'general.error': '⟒⍀⍀⍜⍀',
    'general.success': '⌇⎍☊☊⟒⌇⌇',
    'general.cancel': '☊⏃⋏☊⟒⌰',
    'general.confirm': '☊⍜⋏⎎⟟⍀⋔',
    'general.save': '⌇⏃⎐⟒',
    'general.close': '☊⌰⍜⌇⟒',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  ja: '日本語',
  zh: '中文',
  es: 'Español',
  alien: '⏃⌰⟟⟒⋏',
};
