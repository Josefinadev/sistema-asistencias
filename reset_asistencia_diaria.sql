-- Logica de asistencia por turno.
-- El turno diario se reinicia a las 11:00 a. m. hora local del servidor.

CREATE OR REPLACE FUNCTION obtener_inicio_turno_asistencia(p_fecha TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ AS $$
DECLARE
    inicio_turno TIMESTAMPTZ;
BEGIN
    inicio_turno := date_trunc('day', p_fecha) + interval '11 hour';

    IF EXTRACT(HOUR FROM p_fecha) < 11 THEN
        inicio_turno := inicio_turno - interval '1 day';
    END IF;

    RETURN inicio_turno;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ver_estado_asistencia(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    ultima_asistencia TIMESTAMPTZ;
    inicio_turno TIMESTAMPTZ := obtener_inicio_turno_asistencia();
    siguiente_reinicio TIMESTAMPTZ := inicio_turno + interval '1 day';
    puede_marcar BOOLEAN := true;
    tiempo_restante TEXT := '';
BEGIN
    SELECT fecha_hora INTO ultima_asistencia
    FROM asistencias
    WHERE usuario_id = p_user_id
      AND tipo = 'llegada'
    ORDER BY fecha_hora DESC
    LIMIT 1;

    IF ultima_asistencia IS NOT NULL AND ultima_asistencia >= inicio_turno THEN
        puede_marcar := false;
        tiempo_restante := 'Ya marcaste asistencia en este turno. Se reinicia a las 11:00 a. m.';
    END IF;

    RETURN json_build_object(
        'puede_marcar', puede_marcar,
        'tiempo_restante', tiempo_restante,
        'ultima_asistencia', ultima_asistencia,
        'inicio_turno', inicio_turno,
        'siguiente_reinicio', siguiente_reinicio
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION marcar_asistencia_seguro(
    p_user_id UUID,
    p_tipo TEXT DEFAULT 'llegada'
)
RETURNS JSON AS $$
DECLARE
    ultima_asistencia TIMESTAMPTZ;
    inicio_turno TIMESTAMPTZ := obtener_inicio_turno_asistencia();
BEGIN
    SELECT fecha_hora INTO ultima_asistencia
    FROM asistencias
    WHERE usuario_id = p_user_id
      AND tipo = 'llegada'
    ORDER BY fecha_hora DESC
    LIMIT 1;

    IF ultima_asistencia IS NOT NULL AND ultima_asistencia >= inicio_turno THEN
        RETURN json_build_object(
            'success', false,
            'mensaje', 'Ya marcaste asistencia en este turno. Debes esperar hasta las 11:00 a. m. para marcar nuevamente.'
        );
    END IF;

    INSERT INTO asistencias (usuario_id, tipo, fecha_hora)
    VALUES (p_user_id, p_tipo, NOW());

    RETURN json_build_object(
        'success', true,
        'mensaje', 'Asistencia marcada correctamente para el turno actual.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'mensaje', 'Error al marcar asistencia. Intentalo de nuevo.'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_asistencias_diarias()
RETURNS TEXT AS $$
BEGIN
    -- La validacion real se hace por turno; este cron solo deja trazabilidad.
    INSERT INTO logs_sistema (tipo, mensaje, fecha_hora)
    VALUES ('RESET_ASISTENCIAS', 'Reinicio logico de asistencias ejecutado para el turno de las 11:00 a. m.', NOW());

    RETURN 'Reinicio logico de asistencias registrado';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
