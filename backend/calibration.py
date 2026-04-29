PRIORITY_AREAS = [
    'Ekonomi',
    'Migration',
    'Integration',
    'Utbildning',
    'Välfärd',
    'Miljö & Klimat',
    'Lag & Ordning',
    'Energi',
    'Försvar & utrikespolitik',
    'Demokrati & rättigheter',
]

AREA_TO_PRIORITY_AREA = {
    'Ekonomi': 'Ekonomi',
    'Arbetsmarknad': 'Ekonomi',
    'Bostäder': 'Ekonomi',
    'Pensioner': 'Välfärd',
    'Regional politik': 'Ekonomi',
    'Migration': 'Migration',
    'Integration': 'Integration',
    'Utbildning': 'Utbildning',
    'Kultur': 'Utbildning',
    'Välfärd': 'Välfärd',
    'Hälsa': 'Välfärd',
    'Familj': 'Välfärd',
    'Miljö & Klimat': 'Miljö & Klimat',
    'Lag & Ordning': 'Lag & Ordning',
    'Energi': 'Energi',
    'Försvar': 'Försvar & utrikespolitik',
    'EU & Utrikespolitik': 'Försvar & utrikespolitik',
    'Demokrati & Media': 'Demokrati & rättigheter',
    'Sociala rättigheter': 'Demokrati & rättigheter',
}


def get_priority_area(question_or_area) -> str:
    area = question_or_area.get('area') if isinstance(question_or_area, dict) else question_or_area
    return AREA_TO_PRIORITY_AREA.get(area, area)


def get_valid_priority_areas() -> set:
    return set(PRIORITY_AREAS)
